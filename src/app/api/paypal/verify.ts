import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { upsertUserPayment } from '@/services/databaseService';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

// Configure PayPal environment
const environment = new checkoutNodeJssdk.core.LiveEnvironment(
  process.env.PAYPAL_CLIENT_ID!,
  process.env.PAYPAL_SECRET!
);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

// TODO: Use @paypal/checkout-server-sdk to verify/capture payment and update user status

export async function POST(req: NextRequest) {
  // req.method check is handled by the named export POST

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderID, planType } = await req.json();
    if (!orderID || !planType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Capture the payment
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    // request.requestBody({}); // As per SDK docs for capture, body can be empty or specific if needed.
    const capture = await client.execute(request);

    // Ensure capture and capture.result exist before accessing properties
    if (capture && capture.result && capture.result.status === 'COMPLETED') {
      // Update user payment status in database
      await upsertUserPayment({
        user_id: userId,
        plan: planType,
        status: 'completed',
        payment_id: orderID,
        // Optionally, add more details from capture.result if needed
        // amount: capture.result.purchase_units[0].payments.captures[0].amount.value,
        // currency: capture.result.purchase_units[0].payments.captures[0].amount.currency_code,
      });

      return NextResponse.json(
        { 
          success: true, 
          message: 'Payment verified and captured successfully',
          details: capture.result
        }, 
        { status: 200 }
      );
    } else {
      // Handle other statuses (e.g., PENDING, FAILED) or if result is not as expected
      const status = capture && capture.result ? capture.result.status : 'unknown';
      await upsertUserPayment({
        user_id: userId,
        plan: planType,
        status: status.toLowerCase(), // Store actual status
        payment_id: orderID
      });

      return NextResponse.json(
        { 
          success: false, // Changed to false as it's not a final success
          message: `Payment status: ${status}`,
          details: capture.result // Send back PayPal's response for client-side handling if needed
        }, 
        // Use 202 for pending, or an appropriate error code for failed payments
        status === 'PENDING' ? { status: 202 } : { status: 400 } 
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    
    // Improved error handling with proper type checking
    let errorMessage = 'Unknown server error';
    let statusCode = 500;
    
    if (error && typeof error === 'object') {
      // Try to extract message and status code if available
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
        
        // Try to parse JSON from error message (common in PayPal errors)
        try {
          const parsedError = JSON.parse(errorMessage);
          if (parsedError && typeof parsedError === 'object') {
            return NextResponse.json(
              {
                error: 'PayPal API error during payment verification',
                details: parsedError
              },
              { status: 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500 }
            );
          }
        } catch (parseError) {
          // Not JSON, continue with the string message
        }
      }
      
      // Use statusCode if available
      if ('statusCode' in error && typeof error.statusCode === 'number') {
        statusCode = error.statusCode;
      }
    }
    
    // General error response
    return NextResponse.json(
      {
        error: 'Failed to verify payment',
        details: errorMessage
      },
      { status: statusCode }
    );
  }
} 