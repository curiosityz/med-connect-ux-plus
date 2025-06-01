import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

// Configure PayPal environment
const environment = new checkoutNodeJssdk.core.LiveEnvironment(
  process.env.PAYPAL_CLIENT_ID!,
  process.env.PAYPAL_SECRET!
);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') { // This check is somewhat redundant with named export but good for clarity
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, description } = await req.json();
    if (!amount || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    return NextResponse.json(order.result, { status: 200 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 