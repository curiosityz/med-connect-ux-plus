require('dotenv').config(); // Load environment variables first
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Security middleware
const compression = require('compression'); // Response compression
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const { validate, Joi } = require('express-validation');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const winston = require('winston');

// --- Logging Configuration ---
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'rx-provider-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
});

// --- Environment Validation ---
const requiredEnvVars = [
  'SUPABASE_URL', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'DB_USER', 
  'DB_HOST', 
  'DB_DATABASE', 
  'DB_PASSWORD'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// --- Initialize Express Application ---
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// --- Middleware Stack ---
// Security headers
app.use(helmet());

// Compression
app.use(compression());

// Logging
app.use(morgan(isProduction ? 'combined' : 'dev', {
  stream: { write: message => logger.info(message.trim()) }
}));

// CORS configuration with more granular options
app.use(cors({
  origin: isProduction ? process.env.ALLOWED_ORIGINS?.split(',') || '*' : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting - different for production vs development
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Request ID middleware
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// --- Services Initialization ---
// Initialize Supabase Client with error handling
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase;

try {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });
  logger.info('Supabase client initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Supabase client', { error });
  process.exit(1);
}

// PostgreSQL connection pool with optimized settings
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum number of clients
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection
  ssl: isProduction ? { rejectUnauthorized: false } : false // SSL in production
});

// Set up database connection monitoring
pool.on('connect', client => {
  logger.debug('New client connected to RX PostgreSQL database');
});

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle PostgreSQL client', { error: err });
});

pool.on('remove', client => {
  logger.debug('Client removed from pool');
});

// --- Validation Schemas ---
const findProvidersSchema = {
  body: Joi.object({
    drugName: Joi.string().required(),
    radiusMiles: Joi.number().min(1).max(100).default(10),
    minClaims: Joi.number().min(0).default(0),
    taxonomyClass: Joi.string().allow(null, ''),
    sortBy: Joi.string().valid('distance', 'claims', 'name').default('distance'),
    locationName: Joi.string().allow(null, ''),
    zipCode: Joi.string().pattern(/^\d{5}$/).allow(null, '')
  })
};

// --- Authentication Middleware ---
const authenticateToken = async (req, res, next) => {
  const requestId = req.id;
  logger.debug('Processing authentication', { requestId });
  
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    logger.warn('Authentication failed: No authorization header', { requestId });
    return res.status(401).json({ error: "Authorization header required" });
  }
  
  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  if (!token) {
    logger.warn('Authentication failed: Missing token', { requestId });
    return res.status(401).json({ error: "Bearer token not found" });
  }

  try {
    // Verify token with Supabase Auth and get user data
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Authentication failed: Invalid token', { 
        requestId,
        error: error?.message || 'User not found'
      });
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Attach user context to request
    req.user = {
      id: user.id,
      email: user.email,
      requestId
    };
    
    logger.info('User authenticated successfully', { 
      requestId,
      userId: user.id,
      userEmail: user.email
    });
    
    next();
  } catch (err) {
    logger.error('Authentication error', { requestId, error: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};

// --- Service Layer ---
const userService = {
  async getUserTier(userId) {
    logger.debug('Fetching user tier', { userId });
    
    const { data, error } = await supabase
      .from('profiles')
      .select('membership_tier')
      .eq('id', userId)
      .single();
      
    if (error) {
      logger.error('Error fetching user tier', { userId, error: error.message });
      throw new Error(`Failed to fetch user tier: ${error.message}`);
    }
    
    if (!data) {
      logger.warn('User profile not found', { userId });
      throw new Error('User profile not found');
    }
    
    return data.membership_tier;
  },
  
  async getUserLocation(userId, options = {}) {
    const { locationName, isPrimary = false } = options;
    
    logger.debug('Fetching user location', { userId, locationName, isPrimary });
    
    const query = supabase
      .from('user_locations')
      .select('zip_code, location_name')
      .eq('user_id', userId);
      
    if (isPrimary) {
      query.eq('is_primary', true);
    }
    
    if (locationName) {
      query.eq('location_name', locationName);
    }
    
    const { data, error } = await query.limit(1).single();
    
    if (error) {
      logger.error('Error fetching user location', { 
        userId, 
        locationName, 
        isPrimary,
        error: error.message 
      });
      throw new Error(`Failed to fetch user location: ${error.message}`);
    }
    
    if (!data) {
      logger.warn('User location not found', { userId, locationName, isPrimary });
      throw new Error(locationName 
        ? `Location '${locationName}' not found` 
        : 'Primary location not set or not found');
    }
    
    return data;
  }
};

const providerService = {
  async findProviders(params) {
    const { 
      zipCode, 
      drugName, 
      radiusMiles, 
      minClaims, 
      taxonomyClass, 
      sortBy,
      requestId
    } = params;
    
    logger.debug('Finding providers with params', { 
      requestId,
      zipCode, 
      drugName, 
      radiusMiles, 
      minClaims,
      taxonomyClass,
      sortBy
    });
    
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM find_prescribers_near_zip_refined(
          p_zip_code => $1,
          p_drug_name => $2,
          p_radius_miles => $3,
          p_min_claims => $4,
          p_taxonomy_class => $5,
          p_sort_by => $6
        )
      `;
      
      const values = [
        zipCode,
        drugName,
        radiusMiles,
        minClaims,
        taxonomyClass,
        sortBy
      ];

      const results = await client.query(query, values);
      logger.info(`Provider search completed`, { 
        requestId,
        zipCode, 
        drugName,
        resultCount: results.rows.length 
      });
      
      return results.rows;
    } finally {
      client.release();
      logger.debug('Database client released', { requestId });
    }
  }
};

// --- API Routes ---
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Provider search endpoint with validation
app.post(
  '/api/find-providers',
  authenticateToken,
  validate(findProvidersSchema, { keyByField: true }, { abortEarly: false }),
  async (req, res) => {
    const requestId = req.id;
    const userId = req.user.id;
    
    logger.info('Processing find-providers request', { requestId, userId });
    
    // Extract parameters from request body
    const {
      drugName,
      radiusMiles = 10,
      minClaims = 0,
      taxonomyClass = null,
      sortBy = 'distance',
      locationName,
      zipCode
    } = req.body;

    try {
      // 1. Get user tier
      const userTier = await userService.getUserTier(userId);
      logger.info('User tier retrieved', { requestId, userId, userTier });
      
      // 2. Determine search zip code based on tier
      let searchZip;
      
      if (userTier === 'basic') {
        const location = await userService.getUserLocation(userId, { isPrimary: true });
        searchZip = location.zip_code;
        
      } else if (userTier === 'premium') {
        if (!locationName) {
          logger.warn('Missing location name for premium user', { requestId, userId });
          return res.status(400).json({ error: "Missing required parameter for premium tier: locationName" });
        }
        
        const location = await userService.getUserLocation(userId, { locationName });
        searchZip = location.zip_code;
        
      } else if (userTier === 'expert') {
        if (!zipCode) {
          logger.warn('Missing zip code for expert user', { requestId, userId });
          return res.status(400).json({ error: "Missing zipCode parameter required for expert tier" });
        }
        searchZip = zipCode;
        
      } else {
        logger.warn('Invalid user tier', { requestId, userId, userTier });
        return res.status(403).json({ error: "Invalid user membership tier" });
      }
      
      // 3. Find providers
      const providers = await providerService.findProviders({
        zipCode: searchZip,
        drugName,
        radiusMiles,
        minClaims,
        taxonomyClass,
        sortBy,
        requestId
      });
      
      // 4. Return results
      res.json(providers);
      
    } catch (err) {
      if (err.message.includes('not found')) {
        logger.warn('Resource not found', { requestId, userId, error: err.message });
        return res.status(404).json({ error: err.message });
      }
      
      logger.error('Error in find-providers endpoint', { 
        requestId, 
        userId, 
        error: err.message,
        stack: err.stack
      });
      
      res.status(500).json({ error: "An unexpected error occurred, please try again later" });
    }
  }
);

// Error handling for validation errors
app.use((err, req, res, next) => {
  if (err instanceof Error) {
    if (err.name === 'ValidationError') {
      logger.warn('Validation error', { 
        requestId: req.id, 
        error: err.details 
      });
      return res.status(400).json({
        error: 'Validation Error',
        details: err.details
      });
    }
  }
  
  logger.error('Unhandled error', { 
    requestId: req.id, 
    error: err.message,
    stack: err.stack
  });
  
  res.status(500).json({ error: 'Internal Server Error' });
});

// --- Graceful Shutdown ---
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received - initiating graceful shutdown`);
  
  // Close database pool
  try {
    await pool.end();
    logger.info('Database pool has ended');
  } catch (err) {
    logger.error('Error closing database pool', { error: err.message });
  }
  
  // Exit process
  process.exit(0);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, stack: reason.stack });
});

// --- Start Server ---
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  });
}

// Export for testing
module.exports = { app, pool, logger };