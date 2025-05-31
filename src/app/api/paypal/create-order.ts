import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

// Configure PayPal environment
const environment = new checkoutNodeJssdk.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID!,
  process.env.PAYPAL_SECRET!
);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, description } = req.body;
    if (!amount || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create the order
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount
        },
        description: description,
        custom_id: userId
      }]
    });

    const order = await client.execute(request);
    return res.status(200).json(order.result);
  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ 
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 