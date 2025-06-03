import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

console.log("CREATE_ORDER_ROUTE: Top of file");

// Configure PayPal environment
let client: checkoutNodeJssdk.core.PayPalHttpClient;
try {
  console.log("CREATE_ORDER_ROUTE: Attempting to initialize PayPal environment");
  console.log("CREATE_ORDER_ROUTE: PAYPAL_CLIENT_ID available:", !!process.env.PAYPAL_CLIENT_ID);
  // Mask the secret for logging, just check its presence
  console.log("CREATE_ORDER_ROUTE: PAYPAL_SECRET available:", !!process.env.PAYPAL_SECRET);

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    console.error("CREATE_ORDER_ROUTE: PayPal client ID or secret is missing!");
    // We will let it throw below to be caught by the outer try/catch if this is the case
    // or handle it explicitly, though POST handler should catch it.
  }

  const environment = new checkoutNodeJssdk.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID!,
    process.env.PAYPAL_SECRET!
  );
  client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);
  console.log("CREATE_ORDER_ROUTE: PayPal client initialized successfully for Sandbox Environment");
} catch (envError) {
  console.error("CREATE_ORDER_ROUTE: Error initializing PayPal environment:", envError);
  // If client initialization fails, we cannot proceed.
  // The POST handler's try/catch should ideally not even be reached,
  // or if it is, `client` would be undefined.
  // It's better to ensure any response from here is JSON.
  // However, top-level errors outside async handlers are tricky in Next.js API routes.
  // This log is crucial.
}

export async function POST(req: NextRequest) {
  console.log("CREATE_ORDER_ROUTE: POST handler invoked");
  if (!client) {
    console.error("CREATE_ORDER_ROUTE: PayPal client is not initialized. Cannot process order.");
    return NextResponse.json(
      { error: 'PayPal client initialization failed. Check server logs.' },
      { status: 500 }
    );
  }

  if (req.method !== 'POST') { // This check is somewhat redundant with named export but good for clarity
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      console.log("CREATE_ORDER_ROUTE: Unauthorized access attempt.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log("CREATE_ORDER_ROUTE: User authenticated:", userId);

    const { amount, description, planType } = await req.json();
    console.log("CREATE_ORDER_ROUTE: Request body parsed:", { amount, description, planType });

    if (!amount || !description || !planType) {
      console.warn("CREATE_ORDER_ROUTE: Missing required fields in request:", { amount, description, planType });
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
        description: `${description} - Plan: ${planType}`,
        custom_id: userId 
      }]
    });
    console.log("CREATE_ORDER_ROUTE: PayPal order request created:", JSON.stringify(request.body, null, 2));

    const order = await client.execute(request);
    console.log("CREATE_ORDER_ROUTE: PayPal order executed successfully. Order ID:", order.result.id);
    return NextResponse.json(order.result, { status: 200 });
  } catch (error) {
    console.error('CREATE_ORDER_ROUTE: Order creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 