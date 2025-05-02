
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dataRoutes from './routes/data';                 // Import API routes
import stripeWebhookHandler from './webhooks/stripe';   // Import Stripe webhook handler
import { verifyTokenAndCheckPayment } from './middleware/auth'; // Import authentication middleware

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000; // Use port from .env or default to 3000

// --- Global Middleware ---

// CORS Configuration: Be more restrictive in production!
// Allow requests from your specific frontend domain.
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // Use env variable or '*' for dev (less secure)
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // If you need to handle cookies or auth headers
};
app.use(cors(corsOptions));

// IMPORTANT: Stripe webhook requires the raw request body for signature verification.
// Apply this middleware *only* to the webhook route, BEFORE express.json().
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// For all other routes, use express.json() to parse JSON request bodies
app.use(express.json());

// Basic request logging middleware (optional)
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[server]: ${req.method} ${req.originalUrl}`);
    next();
});


// --- Routes ---

// Public health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount your protected API routes under '/api'
// The verifyTokenAndCheckPayment middleware will run for all routes defined in dataRoutes
app.use('/api/data', verifyTokenAndCheckPayment, dataRoutes);

// Add other routers here if needed
// e.g., app.use('/api/otherfeature', verifyTokenAndCheckPayment, otherFeatureRoutes);
// e.g., app.use('/public-info', publicInfoRoutes); // Routes that don't need auth


// --- Error Handling Middleware (Basic Example) ---
// Should be placed after all routes
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[server]: Unhandled Error:', err.stack);
    res.status(500).send('Something broke!');
});


// --- Start Server ---
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
    console.log(`[server]: CORS enabled for origin: ${corsOptions.origin}`);
    console.log(`[server]: Stripe webhook listening at /webhooks/stripe`);
    console.log(`[server]: Protected API routes available under /api/data`);
});
