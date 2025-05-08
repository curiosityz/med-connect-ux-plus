require('dotenv').config(); // Load environment variables first
import express, { json, urlencoded } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import rateLimit from 'express-rate-limit';
// @ts-ignore - No types available for express-validation
import { validate, Joi, ValidationError } from 'express-validation';
import { v4 as uuidv4 } from 'uuid';
import morgan from 'morgan';
// @ts-ignore - Ignore if @types/winston not found/working
import { createLogger, format as _format, transports as _transports } from 'winston';
import cookieParser from 'cookie-parser';

// --- Type Imports for JSDoc ---
/**
 * @typedef {import('express').Request} ExpressRequest
 * @typedef {import('express').Response} ExpressResponse
 * @typedef {import('express').NextFunction} NextFunction
 * @typedef {import('@supabase/supabase-js').User} SupabaseUser
 * @typedef {import('express-serve-static-core').ParamsDictionary} ParamsDictionary
 * @typedef {import('qs').ParsedQs} ParsedQs
 * @typedef {import('pg').QueryResult<any>} QueryResult
 */

// --- Custom Request Type ---
/**
 * @typedef {object} AuthenticatedUser
 * @property {string} id - Supabase User ID (UUID)
 * @property {string} email
 * @property {'basic' | 'premium' | 'expert' | null} [tier]
 * @property {string} requestId
 */
/**
 * Represents an Express Request augmented with custom properties.
 * @typedef {ExpressRequest & { id: string, user?: AuthenticatedUser }} CustomRequest
 */


// --- Logging Configuration ---
// @ts-ignore - Ignore if @types/winston not found/working
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: _format.combine(
    // @ts-ignore
    _format.timestamp(),
    // @ts-ignore
    _format.json()
  ),
  defaultMeta: { service: 'rx-provider-service' },
  transports: [
    // @ts-ignore
    new _transports.Console({ format: _format.simple() }),
    // @ts-ignore
    new _transports.File({ filename: 'error.log', level: 'error' }),
    // @ts-ignore
    new _transports.File({ filename: 'combined.log' })
  ],
});

// --- Environment Validation ---
const requiredEnvVars = [
  'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
  'DB_USER', 'DB_HOST', 'DB_DATABASE', 'DB_PASSWORD'
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
app.use(helmet());
app.use(compression());
app.use(morgan(isProduction ? 'combined' : 'dev', {
  stream: { write: (/** @type {string} */ message) => logger.info(message.trim()) }
}));
app.use(cors({
  origin: isProduction ? process.env.ALLOWED_ORIGINS?.split(',') || '*' : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));
app.use(json({ limit: '1mb' }));
app.use(urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// @ts-ignore - Ignore rateLimit type issue if types conflict
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', apiLimiter);

/** @type {import('express').RequestHandler} */
app.use((req, res, next) => {
  const customReq = /** @type {CustomRequest} */ (req);
  customReq.id = uuidv4();
  res.setHeader('X-Request-ID', customReq.id);
  next();
});

// --- Services Initialization ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
/** @type {import('@supabase/supabase-js').SupabaseClient} */
let supabase;
try {
  if (!supabaseUrl || !supabaseServiceRoleKey) throw new Error('Supabase URL or Service Role Key missing.');
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });
  logger.info('Supabase client initialized successfully');
} catch (error) {
  const err = /** @type {Error} */ (error);
  logger.error('Failed to initialize Supabase client', { error: err.message });
  process.exit(1);
}

const pool = new Pool({
  user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD, port: parseInt(process.env.DB_PORT || '5432', 10),
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, ssl: isProduction ? { rejectUnauthorized: false } : false
});
pool.on('connect', (/** @type {import('pg').PoolClient} */ client) => { logger.debug('New client connected'); });
pool.on('error', (/** @type {Error} */ err, /** @type {import('pg').PoolClient} */ client) => { logger.error('Idle client error', { error: err.message }); });
pool.on('remove', (/** @type {import('pg').PoolClient} */ client) => { logger.debug('Client removed'); });

// --- Validation Schemas ---
const findProvidersSchema = {
  body: Joi.object({
    drugName: Joi.string().required(), radiusMiles: Joi.number().min(1).max(100).default(10),
    minClaims: Joi.number().min(0).default(0), taxonomyClass: Joi.string().allow(null, ''),
    sortBy: Joi.string().valid('distance', 'claims', 'name').default('distance'),
    locationName: Joi.string().allow(null, ''), zipCode: Joi.string().pattern(/^\d{5}$/).allow(null, ''),
    acceptedInsurance: Joi.array().items(Joi.string()).optional(), minRating: Joi.number().min(0).max(5).optional(),
    cursor: Joi.number().integer().min(0).optional(), // Assuming offset-based cursor for now
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};
const addLocationSchema = { body: Joi.object({ name: Joi.string().required(), zipCode: Joi.string().pattern(/^\d{5}$/).required() }) };

// --- Authentication Middleware ---
/** @type {import('express').RequestHandler} */
const authenticateToken = async (req, res, next) => {
  const customReq = /** @type {CustomRequest} */ (req);
  const requestId = customReq.id; logger.debug('Processing authentication', { requestId });
  const authHeader = req.headers['authorization']; const token = authHeader && authHeader.split(' ')[1];
  const cookieToken = req.cookies['auth_token'];
  if (!token && !cookieToken) { logger.warn('Auth failed: No token', { requestId }); res.status(401).json({ error: "Auth token required" }); return; }
  const authToken = token || cookieToken;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(authToken);
    if (error || !user) {
      logger.warn('Auth failed: Invalid token', { requestId, error: error?.message || 'User not found' });
      if (cookieToken) res.clearCookie('auth_token'); res.status(403).json({ error: "Invalid or expired token" }); return;
    }
    customReq.user = { id: user.id, email: user.email || 'N/A', requestId };
    logger.info('User authenticated', { requestId, userId: user.id }); next();
  } catch (err) {
    const error = /** @type {Error} */ (err);
    logger.error('Auth error', { requestId, error: error.message, stack: error.stack });
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};

// --- Role-based Access Control Middleware ---
/**
 * @param {Array<'basic' | 'premium' | 'expert'>} allowedTiers
 * @returns {import('express').RequestHandler}
 */
const requireTier = (allowedTiers) => {
  /** @type {import('express').RequestHandler} */
  return async (req, res, next) => {
    const customReq = /** @type {CustomRequest} */ (req);
    const { user } = customReq; if (!user) { res.status(401).json({ error: "User not authenticated" }); return; }
    try {
      const userTier = user.tier || await userService.getUserTier(user.id); user.tier = userTier;
      if (!userTier || !allowedTiers.includes(userTier)) {
        logger.warn('Access denied: insufficient tier', { userId: user.id, required: allowedTiers, actual: userTier });
        res.status(403).json({ error: "Access denied: Insufficient membership tier." }); return;
      } next();
    } catch (err) {
      const error = /** @type {Error} */ (err);
      logger.error('RBAC error', { userId: user.id, error: error.message });
      res.status(500).json({ error: "Internal server error checking permissions." });
    }
  };
};

// --- Service Layer ---
const userService = {
  /** @param {string} userId */
  async getUserTier(userId) {
    logger.debug('Fetching user tier', { userId });
    const { data, error } = await supabase.from('profiles').select('membership_tier').eq('id', userId).single();
    if (error && error.code !== 'PGRST116') { logger.error('Supabase fetch tier error', { userId, error: error.message }); throw error; }
    if (!data) { logger.warn('User profile not found', { userId }); return null; }
    return /** @type {'basic' | 'premium' | 'expert' | null} */ (data.membership_tier);
  },
  /**
   * @param {string} userId
   * @param {{ locationName?: string, isPrimary?: boolean }} options
   */
  async getUserLocation(userId, options = {}) {
    const { locationName, isPrimary = false } = options; logger.debug('Fetching user location', { userId, locationName, isPrimary });
    const client = await pool.connect();
    try {
      let queryText = 'SELECT zip_code, location_name FROM user_locations WHERE user_id = $1'; const queryParams = [userId];
      if (isPrimary) { queryText += ' AND is_primary = true'; }
      if (locationName) { queryText += ' AND location_name = $2'; queryParams.push(locationName); }
      queryText += ' LIMIT 1';
      const { rows } = await client.query(queryText, queryParams);
      if (rows.length === 0) throw new Error(locationName ? `Location '${locationName}' not found` : 'Primary location not found');
      return rows[0];
    } catch (err) {
      const error = /** @type {Error} */ (err); logger.error('DB fetch location error', { userId, error: error.message }); throw error;
    } finally { client.release(); }
  }
};

const providerService = {
  /** @param {any} params */
  async findProviders(params) {
    const { zipCode, drugName, radiusMiles, minClaims, taxonomyClass, sortBy, acceptedInsurance, minRating, cursor = 0, limit = 10, requestId } = params;
    const offset = typeof cursor === 'number' ? cursor : 0; // Use offset for pagination
    const radiusMeters = radiusMiles * 1609.34; // Convert miles to meters

    logger.debug('Finding providers', { requestId, zipCode, drugName, radiusMiles, limit, offset });
    const client = await pool.connect();
    try {
        // 1. Get coordinates for the search zip code
        const zipResult = await client.query('SELECT geom FROM us_zipcodes WHERE zip_code = $1 LIMIT 1', [zipCode]);
        if (zipResult.rows.length === 0) {
            throw new Error(`Coordinates not found for zip code ${zipCode}`);
        }
        const searchGeom = zipResult.rows[0].geom;

        // 2. Build the main query with joins and filters
        let queryParams = [searchGeom, radiusMeters, drugName, minClaims];
        let paramIndex = 5; // Start index for optional params

        let baseQuery = `
            FROM npi_details nd
            JOIN npi_addresses na ON nd.npi = na.npi
            JOIN npi_prescriptions np ON nd.npi = np.npi
            JOIN us_zipcodes uz ON na.provider_business_practice_location_address_postal_code = uz.zip_code
            WHERE ST_DWithin(uz.geom, $1, $2) -- Radius filter
              AND (np.drug_name ILIKE $3 OR np.generic_name ILIKE $3) -- Drug name filter (case-insensitive)
              AND np.total_claim_count >= $4 -- Min claims filter
        `;

        // Add optional filters
        if (taxonomyClass) {
            baseQuery += ` AND nd.healthcare_provider_taxonomy_1_classification ILIKE $${paramIndex}`;
            queryParams.push(`%${taxonomyClass}%`); // Use ILIKE for partial match
            paramIndex++;
        }
        // TODO: Add acceptedInsurance filter
        // TODO: Add minRating filter

        // 3. Get total count
        const countQuery = `SELECT COUNT(DISTINCT nd.npi) as total_count ${baseQuery}`;
        const countResult = await client.query(countQuery, queryParams);
        const totalCount = parseInt(countResult.rows[0]?.total_count || '0', 10);

        // 4. Build final query with selection, ordering, and pagination
        let finalQuery = `
            SELECT DISTINCT
                nd.npi, nd.provider_first_name, nd.provider_last_name_legal_name as provider_last_name,
                nd.provider_credential_text, nd.healthcare_provider_taxonomy_1_classification, nd.healthcare_provider_taxonomy_1_specialization,
                na.provider_first_line_business_practice_location_address as address_line_1, na.provider_second_line_business_practice_location_address as address_line_2,
                na.provider_business_practice_location_address_city_name as city, na.provider_business_practice_location_address_state_name as state,
                na.provider_business_practice_location_address_postal_code as postal_code, na.provider_business_practice_location_address_telephone_number as phone,
                ST_X(uz.geom) as longitude, ST_Y(uz.geom) as latitude, ST_Distance(uz.geom, $1) as distance_meters, np.total_claim_count
                -- TODO: Add rating column if available
            ${baseQuery}
        `;

        // Add ORDER BY clause
        switch (sortBy) {
            case 'claims': finalQuery += ` ORDER BY np.total_claim_count DESC, distance_meters ASC`; break;
            case 'name': finalQuery += ` ORDER BY provider_last_name_legal_name ASC, provider_first_name ASC, distance_meters ASC`; break;
            case 'distance': default: finalQuery += ` ORDER BY distance_meters ASC`; break;
        }

        // Add LIMIT and OFFSET
        finalQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit); queryParams.push(offset);

        // 5. Execute final query
        const results = await client.query(finalQuery, queryParams);
        logger.info(`Provider search completed`, { requestId, resultCount: results.rows.length, totalCount });

        // 6. Calculate next cursor (offset)
        const nextOffset = offset + results.rows.length;
        const nextCursor = nextOffset < totalCount ? nextOffset : null;

        // 7. Format results
        const formattedData = results.rows.map(row => ({
            id: row.npi.toString(), npi: row.npi.toString(),
            name: `${row.provider_first_name || ''} ${row.provider_last_name || ''}`.trim(),
            first_name: row.provider_first_name, last_name: row.provider_last_name,
            title: row.provider_credential_text || '',
            specialties: [row.healthcare_provider_taxonomy_1_classification, row.healthcare_provider_taxonomy_1_specialization].filter(Boolean),
            city: row.city, state: row.state,
            location: `${row.address_line_1 || ''}${row.address_line_2 ? ', ' + row.address_line_2 : ''}, ${row.city || ''}, ${row.state || ''} ${row.postal_code || ''}`.replace(/^, |, $/g, '').trim(),
            rating: row.rating || 0, review_count: row.review_count || 0, availability: 'N/A', // Placeholders
            latitude: row.latitude, longitude: row.longitude,
        }));

        return { data: formattedData, totalCount, nextCursor };
    } finally { client.release(); }
  },

  /**
   * @param {string} providerId (NPI)
   * @param {string} requestId
   */
  async getProviderDetails(providerId, requestId) {
    logger.debug('Fetching provider details', { requestId, providerId });
    const client = await pool.connect();
    try {
      const query = `
        SELECT
            nd.npi, nd.provider_first_name, nd.provider_last_name_legal_name as provider_last_name, nd.provider_credential_text,
            nd.healthcare_provider_taxonomy_1_classification, nd.healthcare_provider_taxonomy_1_specialization,
            na.provider_first_line_business_practice_location_address as address_line_1, na.provider_second_line_business_practice_location_address as address_line_2,
            na.provider_business_practice_location_address_city_name as city, na.provider_business_practice_location_address_state_name as state,
            na.provider_business_practice_location_address_postal_code as postal_code, na.provider_business_practice_location_address_telephone_number as phone,
            ST_X(uz.geom) as longitude, ST_Y(uz.geom) as latitude,
            -- TODO: Add bio, rating, review_count if available
            (SELECT json_agg(json_build_object('id', np.prescription_id, 'name', np.drug_name, 'genericName', np.generic_name))
             FROM npi_prescriptions np WHERE np.npi = nd.npi) as prescribed_medications
        FROM npi_details nd
        LEFT JOIN npi_addresses na ON nd.npi = na.npi
        LEFT JOIN us_zipcodes uz ON na.provider_business_practice_location_address_postal_code = uz.zip_code
        WHERE nd.npi = $1 LIMIT 1;`;
      const { rows } = await client.query(query, [providerId]);
      if (rows.length === 0) { logger.warn('Provider not found', { requestId, providerId }); return null; }

      const row = rows[0];
      const formattedProvider = {
            id: row.npi.toString(), npi: row.npi.toString(),
            name: `${row.provider_first_name || ''} ${row.provider_last_name || ''}`.trim(),
            first_name: row.provider_first_name, last_name: row.provider_last_name,
            title: row.provider_credential_text || '',
            specialties: [row.healthcare_provider_taxonomy_1_classification, row.healthcare_provider_taxonomy_1_specialization].filter(Boolean),
            city: row.city, state: row.state,
            location: `${row.address_line_1 || ''}${row.address_line_2 ? ', ' + row.address_line_2 : ''}, ${row.city || ''}, ${row.state || ''} ${row.postal_code || ''}`.replace(/^, |, $/g, '').trim(),
            rating: row.rating || 0, review_count: row.review_count || 0, availability: 'N/A', // Placeholders
            latitude: row.latitude, longitude: row.longitude, phone: row.phone, bio: row.bio || null, // Placeholder
            prescribed_medications: row.prescribed_medications || [],
      };
      logger.info('Provider details fetched', { requestId, providerId }); return formattedProvider;
    } finally { client.release(); }
  }
};

// --- API Routes ---
/** @type {import('express').RequestHandler} */
const healthCheckHandler = (req, res) => { res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), environment: NODE_ENV }); };
app.get('/health', healthCheckHandler);

/** @type {import('express').RequestHandler} */
const findProvidersHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    logger.info('Processing find-providers', { requestId, userId });
    const { drugName, radiusMiles, minClaims, taxonomyClass, sortBy, locationName, zipCode, acceptedInsurance, minRating, cursor, limit } = req.body;
    try {
      const userTier = await userService.getUserTier(userId); logger.info('User tier', { requestId, userId, userTier });
      let searchZip;
      if (userTier === 'basic') { const loc = await userService.getUserLocation(userId, { isPrimary: true }); searchZip = loc.zip_code; }
      else if (userTier === 'premium') { if (!locationName) { res.status(400).json({ error: "locationName required for premium" }); return; } const loc = await userService.getUserLocation(userId, { locationName }); searchZip = loc.zip_code; }
      else if (userTier === 'expert') { if (!zipCode) { res.status(400).json({ error: "zipCode required for expert" }); return; } searchZip = zipCode; }
      else { if (!zipCode) { res.status(400).json({ error: "Zip code required" }); return; } searchZip = zipCode; }
      if (!searchZip) { logger.warn('Could not determine search zip code', { requestId, userId }); res.status(400).json({ error: "Could not determine search location." }); return; }
      const results = await providerService.findProviders({ zipCode: searchZip, drugName, radiusMiles, minClaims, taxonomyClass, sortBy, acceptedInsurance, minRating, cursor, limit, requestId });
      res.json(results);
    } catch (err) {
      const error = /** @type {Error} */ (err);
      if (error.message.includes('not found')) { logger.warn('Resource not found', { requestId, error: error.message }); res.status(404).json({ error: error.message }); return; }
      logger.error('find-providers error', { requestId, error: error.message, stack: error.stack }); res.status(500).json({ error: "Unexpected error during provider search" });
    }
};
// @ts-ignore - Ignore validation middleware type issue if @types/express-validation is missing
app.post('/api/find-providers', authenticateToken, validate(findProvidersSchema, {}, {}), findProvidersHandler);

/** @type {import('express').RequestHandler} */
const getProviderDetailsHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id; const providerId = req.params.id;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; } if (!providerId) { res.status(400).json({ error: 'Provider ID required.' }); return; }
    logger.info('Processing provider detail', { requestId, userId, providerId });
    try {
        const providerDetails = await providerService.getProviderDetails(providerId, requestId);
        if (!providerDetails) { res.status(404).json({ error: 'Provider not found.' }); return; }
        res.json(providerDetails);
    } catch (err) {
        const error = /** @type {Error} */ (err); logger.error('Provider detail error', { requestId, error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Internal server error' });
    }
};
app.get('/api/providers/:id', authenticateToken, getProviderDetailsHandler);

// --- Auth Sync & Membership Endpoints ---
/** @type {import('express').RequestHandler} */
const syncUserHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id; const userEmail = customReq.user?.email;
    if (!userId || !userEmail) { res.status(401).json({ success: false, message: 'User not authenticated.' }); return; }
    logger.info('Processing sync-user', { requestId, userId });
    try {
        const { data: existingProfile, error: fetchError } = await supabase.from('profiles').select('id, email, membership_tier').eq('id', userId).single();
        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        if (existingProfile) {
            if (existingProfile.email !== userEmail) { logger.info('Updating email', { requestId, userId }); const { error: uError } = await supabase.from('profiles').update({ email: userEmail }).eq('id', userId); if (uError) throw uError; }
            res.json({ success: true, message: 'User synced.', data: { membershipTier: existingProfile.membership_tier } });
        } else {
            logger.info('Creating profile', { requestId, userId }); const defaultTier = 'basic';
            const { data: newProfile, error: iError } = await supabase.from('profiles').insert({ id: userId, email: userEmail, membership_tier: defaultTier }).select('membership_tier').single(); if (iError) throw iError;
            res.status(201).json({ success: true, message: 'Profile created.', data: { membershipTier: newProfile.membership_tier } });
        }
    } catch (err) {
        const error = /** @type {Error} */ (err); logger.error('Sync-user error', { requestId, error: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
app.post('/api/sync-user', authenticateToken, syncUserHandler);

/** @type {import('express').RequestHandler} */
const getMembershipHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    logger.info('Processing user-membership', { requestId, userId });
    try {
        const tier = await userService.getUserTier(userId); logger.info('Membership fetched', { requestId, userId, tier });
        res.json({ membershipTier: tier });
    } catch (err) {
        const error = /** @type {Error} */ (err); logger.error('Membership fetch error', { requestId, error: error.message });
        if (error.message.toLowerCase().includes('not found')) res.status(404).json({ membershipTier: null, error: 'Profile not found.' });
        else res.status(500).json({ membershipTier: null, error: 'Internal server error' });
    }
};
app.post('/api/user-membership', authenticateToken, getMembershipHandler);

// --- User Location Management Endpoints ---
const USER_LOCATIONS_BASE = '/api/user/locations';

/** @type {import('express').RequestHandler} */
const getUserLocationsHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    logger.info('Fetching locations', { requestId, userId });
    const client = await pool.connect();
    try {
        const { rows } = await client.query('SELECT user_location_id as id, location_name as name, zip_code as "zipCode", is_primary as "isPrimary" FROM user_locations WHERE user_id = $1 ORDER BY is_primary DESC, location_name ASC', [userId]);
        res.json(rows);
    } catch (err) {
        const error = /** @type {Error} */ (err); logger.error('Fetch locations error', { requestId, error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    } finally { client.release(); }
};
app.get(USER_LOCATIONS_BASE, authenticateToken, getUserLocationsHandler);

/** @type {import('express').RequestHandler} */
const addUserLocationHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id; const { name, zipCode } = req.body;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    logger.info('Adding location', { requestId, userId, name });
    const client = await pool.connect();
    try {
        const zipCheck = await client.query('SELECT 1 FROM us_zipcodes WHERE zip_code = $1 LIMIT 1', [zipCode]);
        if (zipCheck.rowCount === 0) { res.status(400).json({ error: `Invalid zip code: ${zipCode}` }); return; }
        const { rowCount } = await client.query('SELECT 1 FROM user_locations WHERE user_id = $1 AND location_name = $2', [userId, name]);
        if (rowCount != null && rowCount > 0) { res.status(409).json({ error: `Location "${name}" already exists.` }); return; }
        const { rows } = await client.query('INSERT INTO user_locations (user_id, location_name, zip_code, is_primary) VALUES ($1, $2, $3, false) RETURNING user_location_id as id, location_name as name, zip_code as "zipCode", is_primary as "isPrimary"', [userId, name, zipCode]);
        res.status(201).json(rows[0]);
    } catch (err) {
        const error = /** @type {Error} */ (err); logger.error('Add location error', { requestId, error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    } finally { client.release(); }
};
// @ts-ignore - Ignore validation middleware type issue if @types/express-validation is missing
app.post(USER_LOCATIONS_BASE, authenticateToken, requireTier(['premium', 'expert']), validate(addLocationSchema, {}, {}), addUserLocationHandler);

/** @type {import('express').RequestHandler} */
const deleteUserLocationHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id; const locationId = req.params.locationId;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    logger.info('Deleting location', { requestId, userId, locationId });
    const client = await pool.connect();
    try {
         const { rows } = await client.query('SELECT is_primary FROM user_locations WHERE user_location_id = $1 AND user_id = $2', [locationId, userId]);
         if (rows.length > 0 && rows[0].is_primary) { res.status(400).json({ error: 'Cannot delete primary location.' }); return; }
        const { rowCount } = await client.query('DELETE FROM user_locations WHERE user_location_id = $1 AND user_id = $2', [locationId, userId]);
        if (rowCount === 0) { res.status(404).json({ error: 'Location not found.' }); return; }
        res.json({ success: true });
    } catch (err) {
        const error = /** @type {Error} */ (err); logger.error('Delete location error', { requestId, error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    } finally { client.release(); }
};
app.delete(`${USER_LOCATIONS_BASE}/:locationId`, authenticateToken, deleteUserLocationHandler);

/** @type {import('express').RequestHandler} */
const setPrimaryLocationHandler = async (req, res) => {
    const customReq = /** @type {CustomRequest} */ (req); const requestId = customReq.id; const userId = customReq.user?.id; const locationId = req.params.locationId;
    if (!userId) { res.status(401).json({ error: "User not authenticated" }); return; }
    logger.info('Setting primary location', { requestId, userId, locationId });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE user_locations SET is_primary = false WHERE user_id = $1 AND user_location_id != $2', [userId, locationId]);
        const { rowCount } = await client.query('UPDATE user_locations SET is_primary = true WHERE user_id = $1 AND user_location_id = $2', [userId, locationId]);
        if (rowCount === 0) { await client.query('ROLLBACK'); res.status(404).json({ error: 'Location not found.' }); return; }
        await client.query('COMMIT'); res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK'); const error = /** @type {Error} */ (err);
        logger.error('Set primary error', { requestId, error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    } finally { client.release(); }
};
app.put(`${USER_LOCATIONS_BASE}/:locationId/set-primary`, authenticateToken, requireTier(['premium', 'expert']), setPrimaryLocationHandler);


// --- Error Handling ---
/**
 * Express error handling middleware.
 * @param {any} err - Error object
 * @param {CustomRequest} req - Use CustomRequest
 * @param {ExpressResponse} res
 * @param {NextFunction} next
 */
// @ts-ignore
app.use((err, req, res, next) => {
  const requestId = req.id || 'unknown';
  // @ts-ignore - Duck typing for express-validation error
  if (err instanceof ValidationError || (err.error?.isJoi === true && err.statusCode === 400)) {
    logger.warn('Validation error', { requestId, error: err.details || err.error?.details });
    // @ts-ignore
    res.status(400).json({ error: 'Validation Error', details: err.details || err.error?.details }); return;
  }
  const error = /** @type {Error & { status?: number }} */ (err);
  const status = error.status || 500; const message = error.message || 'Internal Server Error';
  logger.error('Unhandled error', { requestId, error: message, status, stack: error.stack });
  const responseError = isProduction ? { error: message } : { error: message, stack: error.stack };
  if (!res.headersSent) { res.status(status).json(responseError); }
  else { logger.error('Headers already sent for unhandled error', { requestId }); next(err); }
});

// --- Graceful Shutdown ---
/** @param {string} signal */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received - shutting down`);
  try { await pool.end(); logger.info('DB pool ended'); }
  catch (err) { const error = /** @type {Error} */ (err); logger.error('Error closing DB pool', { error: error.message }); }
  process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
  let errorDetails = {}; if (reason instanceof Error) errorDetails = { message: reason.message, stack: reason.stack }; else errorDetails = { reason: String(reason) };
  logger.error('Unhandled Rejection', errorDetails);
});

// --- Start Server ---
if (require.main === module) {
  app.listen(PORT, () => { logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`); });
}

// Export for testing
export default { app, pool, logger };
