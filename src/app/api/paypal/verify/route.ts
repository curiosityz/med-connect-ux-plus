import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { upsertUserPayment } from '@/services/databaseService';

// Configure PayPal environment
const environment = new checkoutNodeJssdk.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID!,
  process.env.PAYPAL_SECRET!
);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { userId, orgId, getToken } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderID, planType, amount } = await req.json();

    if (!orderID || !planType || !amount) {
      return NextResponse.json({ error: 'Missing orderID, planType, or amount' }, { status: 400 });
    }

    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    let capture;
    try {
      capture = await client.execute(request);
      console.log("PayPal API Response for Order Capture:", JSON.stringify(capture, null, 2));
    } catch (paypalError: any) {
      console.error("PayPal API Error during Order Capture:", paypalError);
      // Check if paypalError.message is a string and contains JSON
      let errorDetails = "PayPal API execution failed.";
      if (typeof paypalError.message === 'string') {
        try {
          const parsedError = JSON.parse(paypalError.message);
          if (parsedError && parsedError.details && parsedError.details[0] && parsedError.details[0].issue === 'ORDER_ALREADY_CAPTURED') {
             console.warn(`Order ${orderID} has already been captured.`);
            // Potentially fetch the order details to confirm and proceed as if successful
            // For now, we'll let it fall through to a generic error, but this could be handled
            // by fetching the order and using its status, or by the webhook confirming it.
            // The critical path is that the webhook should eventually mark it as completed.
            // However, for immediate UI feedback, we might want to treat this as success.
            // Let's try to fetch the order in this case.
            try {
                const getOrderRequest = new checkoutNodeJssdk.orders.OrdersGetRequest(orderID);
                const orderDetails = await client.execute(getOrderRequest);
                if (orderDetails.result.status === 'COMPLETED') {
                    console.log(`Order ${orderID} confirmed as already COMPLETED.`);
                    // Upsert payment with status 'completed' here if relying on verify route primarily
                    await upsertUserPayment({
                        user_id: userId,
                        plan: planType,
                        status: 'completed', // Assuming already completed
                        payment_id: orderID, // or capture.result.id if available from original intent
                        amount: parseFloat(amount),
                        // currency: capture.result.purchase_units[0].payments.captures[0].amount.currency_code -> this is ideal but might not be available here
                    });
                    return NextResponse.json({ 
                        message: 'Order already captured and confirmed completed.', 
                        orderId: orderID,
                        status: 'COMPLETED'
                    }, { status: 200 });
                } else {
                    errorDetails = `Order ${orderID} already captured, but current status is ${orderDetails.result.status}.`;
                }
            } catch (getOrderError) {
                console.error("Error fetching details for already captured order:", getOrderError);
                errorDetails = `Order ${orderID} already captured, but failed to confirm its status.`;
            }
          } else if (parsedError && parsedError.details) {
            errorDetails = parsedError.details.map((d: any) => `${d.issue}: ${d.description}`).join(", ");
          } else if (parsedError && parsedError.message) {
            errorDetails = parsedError.message;
          }
        } catch (jsonParseError) {
          // If paypalError.message is not JSON, use it directly
          errorDetails = paypalError.message;
        }
      }
      return NextResponse.json({ error: 'Failed to capture order with PayPal', details: errorDetails }, { status: 500 });
    }

    const captureID = capture.result.purchase_units[0].payments.captures[0].id;
    const paymentStatus = capture.result.status === 'COMPLETED' ? 'completed' : 'pending';

    await upsertUserPayment({
      user_id: userId,
      plan: planType,
      status: paymentStatus,
      payment_id: orderID, // Using orderID as the primary payment_id reference from client
      // capture_id: captureID, // Optionally store captureID if your DB schema supports it
      amount: parseFloat(amount),
      currency: capture.result.purchase_units[0].payments.captures[0].amount.currency_code,
    });

    console.log(`Payment verification for order ${orderID} processed. Status: ${paymentStatus}`);

    return NextResponse.json({
      message: 'Payment verified successfully',
      orderId: orderID,
      captureId: captureID,
      status: paymentStatus,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
        { 
            error: 'Internal server error during payment verification', 
            details: error.message 
        }, 
        { status: 500 }
    );
  }
} 