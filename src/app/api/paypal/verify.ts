import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { upsertUserPayment } from '@/services/databaseService';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

// Configure PayPal environment
const environment = new checkoutNodeJssdk.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID!,
  process.env.PAYPAL_SECRET!
);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

// TODO: Use @paypal/checkout-server-sdk to verify/capture payment and update user status

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderID, planType } = req.body;
    if (!orderID || !planType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Capture the payment
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    const capture = await client.execute(request);

    if (capture.result.status === 'COMPLETED') {
      // Update user payment status in database
      await upsertUserPayment({
        user_id: userId,
        plan: planType,
        status: 'completed',
        payment_id: orderID
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Payment verified and captured successfully' 
      });
    } else {
      // Update payment status as pending
      await upsertUserPayment({
        user_id: userId,
        plan: planType,
        status: 'pending',
        payment_id: orderID
      });

      return res.status(202).json({ 
        success: true, 
        message: 'Payment is being processed' 
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 