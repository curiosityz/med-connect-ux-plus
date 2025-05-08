const request = require('supertest');
const { app, pool } = require('../server').default;

// Since our services are directly in the server.js file, we'll need to mock differently
// We'll use jest.spyOn to intercept calls to the service methods

// First, make sure the userService and providerService objects are correctly mocked
jest.mock('@supabase/supabase-js'); // Mock the Supabase client

// Mock the service functions directly
const userServiceMock = {
  getUserTier: jest.fn(),
  getUserLocation: jest.fn()
};

const providerServiceMock = {
  findProviders: jest.fn()
};

// Override the original services with our mocks
jest.mock('../server', () => {
  const originalModule = jest.requireActual('../server');
  
  return {
    ...originalModule,
    userService: userServiceMock,
    providerService: providerServiceMock
  };
});

// Mock Supabase auth
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn().mockReturnValue({
      auth: {
        getUser: jest.fn().mockImplementation((token) => {
          if (token === 'valid-token') {
            return {
              data: {
                user: { id: 'test-user-id', email: 'test@example.com' }
              },
              error: null
            };
          } else {
            return {
              data: { user: null },
              error: { message: 'Invalid token' }
            };
          }
        })
      }
    })
  };
});

describe('Provider Search API', () => {
  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Clean up pool after all tests
  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/find-providers', () => {
    it('should return 401 when no auth token is provided', async () => {
      const response = await request(app)
        .post('/api/find-providers')
        .send({ drugName: 'Aspirin' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 when invalid token is provided', async () => {
      const response = await request(app)
        .post('/api/find-providers')
        .set('Authorization', 'Bearer invalid-token')
        .send({ drugName: 'Aspirin' });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });

    it('should return 400 when required params are missing', async () => {
      const response = await request(app)
        .post('/api/find-providers')
        .set('Authorization', 'Bearer valid-token')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation Error');
    });

    it('should handle basic tier user correctly', async () => {
      // Setup mocks
      userService.getUserTier.mockResolvedValue('basic');
      userService.getUserLocation.mockResolvedValue({
        zip_code: '90210',
        location_name: 'Home'
      });
      providerService.findProviders.mockResolvedValue([
        { id: 1, name: 'Dr. Smith', distance: 2.5 }
      ]);
      
      const response = await request(app)
        .post('/api/find-providers')
        .set('Authorization', 'Bearer valid-token')
        .send({ drugName: 'Aspirin' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 1, name: 'Dr. Smith', distance: 2.5 }
      ]);
      
      // Verify the service calls
      expect(userService.getUserTier).toHaveBeenCalledWith('test-user-id');
      expect(userService.getUserLocation).toHaveBeenCalledWith('test-user-id', { isPrimary: true });
      expect(providerService.findProviders).toHaveBeenCalledWith(
        expect.objectContaining({
          zipCode: '90210',
          drugName: 'Aspirin'
        })
      );
    });

    it('should handle premium tier user correctly', async () => {
      // Setup mocks
      userService.getUserTier.mockResolvedValue('premium');
      userService.getUserLocation.mockResolvedValue({
        zip_code: '10001',
        location_name: 'Work'
      });
      providerService.findProviders.mockResolvedValue([
        { id: 2, name: 'Dr. Johnson', distance: 1.5 }
      ]);
      
      const response = await request(app)
        .post('/api/find-providers')
        .set('Authorization', 'Bearer valid-token')
        .send({ 
          drugName: 'Ibuprofen',
          locationName: 'Work' 
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 2, name: 'Dr. Johnson', distance: 1.5 }
      ]);
      
      // Verify the service calls
      expect(userService.getUserTier).toHaveBeenCalledWith('test-user-id');
      expect(userService.getUserLocation).toHaveBeenCalledWith('test-user-id', { locationName: 'Work' });
    });

    it('should handle expert tier user correctly', async () => {
      // Setup mocks
      userService.getUserTier.mockResolvedValue('expert');
      providerService.findProviders.mockResolvedValue([
        { id: 3, name: 'Dr. Williams', distance: 3.2 }
      ]);
      
      const response = await request(app)
        .post('/api/find-providers')
        .set('Authorization', 'Bearer valid-token')
        .send({ 
          drugName: 'Metformin',
          zipCode: '60601',
          radiusMiles: 20,
          minClaims: 5
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 3, name: 'Dr. Williams', distance: 3.2 }
      ]);
      
      // Verify service calls
      expect(userService.getUserTier).toHaveBeenCalledWith('test-user-id');
      expect(userService.getUserLocation).not.toHaveBeenCalled();
      expect(providerService.findProviders).toHaveBeenCalledWith(
        expect.objectContaining({
          zipCode: '60601',
          drugName: 'Metformin',
          radiusMiles: 20,
          minClaims: 5
        })
      );
    });

    it('should handle error when user profile not found', async () => {
      userService.getUserTier.mockRejectedValue(new Error('User profile not found'));
      
      const response = await request(app)
        .post('/api/find-providers')
        .set('Authorization', 'Bearer valid-token')
        .send({ drugName: 'Aspirin' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User profile not found');
    });

    it('should handle database errors gracefully', async () => {
      userService.getUserTier.mockResolvedValue('basic');
      userService.getUserLocation.mockResolvedValue({
        zip_code: '90210'
      });
      providerService.findProviders.mockRejectedValue(new Error('Database connection failed'));
      
      const response = await request(app)
        .post('/api/find-providers')
        .set('Authorization', 'Bearer valid-token')
        .send({ drugName: 'Aspirin' });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'An unexpected error occurred, please try again later');
    });
  });

  describe('GET /health', () => {
    it('should return 200 status with health information', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });
  });
});