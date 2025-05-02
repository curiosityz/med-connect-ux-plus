
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db'; // Import the PostgreSQL connection pool
import dotenv from 'dotenv';

// Load environment variables (needed for SUPABASE_JWT_SECRET)
dotenv.config();

// Extend the Express Request type to include our custom 'user' property
declare global {
    namespace Express {
        interface Request {
            // The decoded JWT payload (Supabase standard claims + your metadata if any)
            // 'sub' is the Supabase User ID (UUID string)
            user?: { sub: string; [key: string]: any };
        }
    }
}

export const verifyTokenAndCheckPayment = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    // Extract token typically sent as "Bearer <TOKEN>"
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log('[Auth Middleware]: Failed - No token provided.');
        return res.sendStatus(401); // Unauthorized - No token
    }

    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
        console.error('[Auth Middleware]: CRITICAL ERROR - SUPABASE_JWT_SECRET is not set.');
        return res.sendStatus(500); // Internal Server Error - Configuration issue
    }

    jwt.verify(token, jwtSecret, async (err: any, decoded: any) => {
        if (err) {
            console.warn(`[Auth Middleware]: Failed - JWT Verification Error: ${err.message}`);
            // Common errors: TokenExpiredError, JsonWebTokenError (malformed/invalid signature)
            return res.sendStatus(403); // Forbidden - Invalid or expired token
        }

        // Validate the structure of the decoded token
        if (typeof decoded !== 'object' || decoded === null || typeof decoded.sub !== 'string') {
            console.error('[Auth Middleware]: Failed - JWT payload is invalid or missing "sub" claim.');
            return res.sendStatus(403); // Forbidden - Malformed token payload
        }

        const supabaseUserId: string = decoded.sub;

        // --- PAYMENT STATUS CHECK in Self-Hosted DB ---
        try {
            const client = await pool.connect(); // Get client from pool
            try {
                const result = await client.query(
                    'SELECT subscription_status FROM users WHERE supabase_user_id = $1',
                    [supabaseUserId]
                );

                if (result.rows.length === 0) {
                    console.warn(`[Auth Middleware]: Access denied for user ${supabaseUserId}: User not found in local DB.`);
                    // Consider if you should automatically create a user record here based on a valid JWT
                    // This depends on your signup flow (e.g., if webhook creates user or first API call does)
                    return res.status(403).send('Access denied: User profile not initialized.');
                }

                const status = result.rows[0].subscription_status;
                if (status !== 'active') {
                    console.warn(`[Auth Middleware]: Payment check failed for user ${supabaseUserId}: Status is '${status}'.`);
                    // Use 402 Payment Required for payment-related access issues
                    return res.status(402).send('Payment Required or Subscription Inactive.');
                }

                // --- Authorization successful ---
                console.log(`[Auth Middleware]: User ${supabaseUserId} authorized.`);
                // Attach the entire decoded payload to the request object
                req.user = decoded as { sub: string; [key: string]: any };
                next(); // Proceed to the next middleware or route handler

            } finally {
                client.release(); // Release client back to the pool MUST happen
            }
        } catch (dbError: any) {
            console.error(`[Auth Middleware]: Database error during auth check for user ${supabaseUserId}:`, dbError);
            return res.sendStatus(500); // Internal Server Error - Database issue
        }
    });
};
