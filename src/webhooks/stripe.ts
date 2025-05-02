
import { Request, Response } from 'express';
import Stripe from 'stripe';
import pool from '../db'; // Import the PostgreSQL connection pool
import dotenv from 'dotenv';

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Validate essential configuration
if (!stripeSecretKey || !webhookSecret) {
    console.error('CRITICAL: Stripe secret key or webhook secret is not defined in .env. Exiting.');
    process.exit(1); // Exit if Stripe keys aren't configured
}

// Initialize Stripe client
const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20', // Use Stripe's recommended API version
    typescript: true,
});

// The actual webhook handler function
const handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
        console.warn('[Stripe Webhook]: Failed - Missing stripe-signature header.');
        return res.status(400).send(`Webhook Error: No signature provided.`);
    }

    let event: Stripe.Event;

    try {
        // Verify the event signature using the raw request body
        // Requires express.raw({type: 'application/json'}) middleware on this route
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        console.log(`[Stripe Webhook]: Verified event type: ${event.type}, ID: ${event.id}`);
    } catch (err: any) {
        console.error(`[Stripe Webhook]: ❌ Signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }

    // --- Handle Specific Stripe Events ---
    try {
        const client = await pool.connect();
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    const session = event.data.object as Stripe.Checkout.Session;
                    console.log(`[Stripe Webhook]: Handling checkout.session.completed for session ${session.id}`);

                    // --- Logic to fulfill the purchase ---
                    // IMPORTANT: Retrieve the user identifier reliably
                    const supabaseUserId = session.metadata?.supabase_user_id; // Assumes you pass this from your frontend checkout
                    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

                    if (!supabaseUserId) {
                        console.error(`[Stripe Webhook]: ERROR - supabase_user_id missing in metadata for session ${session.id}. Cannot update user status.`);
                        // Consider alternatives: lookup by email (session.customer_details?.email) or Stripe Customer ID if reliable
                        break; // Don't proceed without identifying the user
                    }

                    if (!stripeCustomerId) {
                         console.warn(`[Stripe Webhook]: Stripe Customer ID missing for session ${session.id}. Proceeding without saving it.`);
                    }

                    // Update user status to 'active' in your self-hosted DB
                    const updateQuery = `
                        UPDATE users
                        SET subscription_status = $1, stripe_customer_id = $2 -- Add subscription_ends_at if applicable
                        WHERE supabase_user_id = $3
                        RETURNING id;
                    `;
                    const result = await client.query(updateQuery, [
                        'active',
                        stripeCustomerId, // Store Stripe Customer ID
                        supabaseUserId
                    ]);

                    if (result.rowCount > 0) {
                        console.log(`[Stripe Webhook]: Successfully activated subscription for user ${supabaseUserId} (DB ID: ${result.rows[0].id}) via checkout session.`);
                    } else {
                        console.warn(`[Stripe Webhook]: User ${supabaseUserId} not found in local DB during checkout completion. Subscription status not updated.`);
                        // Did the user record get created? Should it be created here?
                    }
                    break;

                // Handle subscription updates/cancellations (important!)
                case 'customer.subscription.updated':
                case 'customer.subscription.deleted':
                    const subscription = event.data.object as Stripe.Subscription;
                    console.log(`[Stripe Webhook]: Handling ${event.type} for subscription ${subscription.id}`);
                    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;

                    if (!customerId) {
                         console.error(`[Stripe Webhook]: ERROR - Customer ID missing for subscription ${subscription.id}. Cannot update status.`);
                         break;
                    }

                    // Determine the new status based on Stripe subscription status
                    let newStatus = 'inactive'; // Default
                    if (subscription.status === 'active' || subscription.status === 'trialing') {
                        newStatus = 'active';
                    } else if (subscription.status === 'canceled' || subscription.status === 'unpaid' || subscription.status === 'incomplete_expired') {
                        newStatus = 'inactive'; // Or 'cancelled', 'lapsed' etc.
                    }
                    // Handle 'past_due' if needed differently

                    // Update status in your DB based on Stripe Customer ID
                    const subUpdateQuery = `
                        UPDATE users
                        SET subscription_status = $1
                        WHERE stripe_customer_id = $2
                        RETURNING supabase_user_id;
                    `;
                    const subResult = await client.query(subUpdateQuery, [newStatus, customerId]);

                    if (subResult.rowCount > 0) {
                         console.log(`[Stripe Webhook]: Updated status to '${newStatus}' for user(s) with Stripe Customer ID ${customerId} (Supabase ID: ${subResult.rows[0].supabase_user_id}).`);
                    } else {
                         console.warn(`[Stripe Webhook]: No user found with Stripe Customer ID ${customerId} during subscription update.`);
                    }
                    break;

                // Add handlers for other events if needed (e.g., 'invoice.payment_failed')

                default:
                    // console.log(`[Stripe Webhook]: Unhandled event type: ${event.type}`);
                    break; // Ignore events you don't need to handle
            }
        } finally {
            client.release(); // Release DB client
        }
    } catch(err) {
        // Catch potential errors within the event handling logic (e.g., DB errors)
         console.error(`[Stripe Webhook]: Error processing event ${event?.id} (type ${event?.type}):`, err);
         // Return 500 to tell Stripe something went wrong on our end processing this specific event
         return res.status(500).json({ error: 'Internal server error handling webhook event.' });
    }


    // Acknowledge receipt of the event successfully
    res.status(200).json({ received: true });
};

// Export the handler function
export default handleStripeWebhook;
