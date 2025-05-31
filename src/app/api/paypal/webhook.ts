import { NextApiRequest, NextApiResponse } from 'next';
import { upsertUserPayment } from '@/services/databaseService';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

// Configure PayPal environment
const environment = new checkoutNodeJssdk.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID!,
  process.env.PAYPAL_SECRET!
);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

// TODO: Use @paypal/checkout-server-sdk or @paypal/paypal-server-sdk for verification
// and update user payment status in DB or Clerk metadata

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      throw new Error('PayPal webhook ID not configured');
    }

    const event = req.body;
    const eventType = event.event_type;
    const resource = event.resource;

    // Handle different event types
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment was successfully captured
        const userId = resource.custom_id;
        const orderId = resource.id;
        const planType = resource.purchase_units[0]?.description || 'Unknown';

        await upsertUserPayment({
          user_id: userId,
          plan: planType,
          status: 'completed',
          payment_id: orderId
        });
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        // Payment was denied/declined
        const failedUserId = resource.custom_id;
        const failedOrderId = resource.id;
        const failedPlanType = resource.purchase_units[0]?.description || 'Unknown';

        await upsertUserPayment({
          user_id: failedUserId,
          plan: failedPlanType,
          status: 'failed',
          payment_id: failedOrderId
        });
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 