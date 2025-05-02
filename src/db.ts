import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a new PostgreSQL connection pool
const pool = new Pool({
    // Read connection details from environment variables
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'), // Default to 5432 if not set
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

    // Optional: Configure pool options (e.g., max connections, idle timeout)
    // max: 20,
    // idleTimeoutMillis: 30000,
    // connectionTimeoutMillis: 2000,
});

// Event listener for successful connection
pool.on('connect', () => {
    console.log('[database]: Connected to self-hosted PostgreSQL database.');
});

// Event listener for errors in the pool
pool.on('error', (err, client) => {
    console.error('[database]: Unexpected error on idle client', err);
    // Depending on the error, you might want to exit or implement retry logic
    // process.exit(-1); // Example: exit on critical pool errors
});

// Export the pool for use in other parts of the application
export default pool;
