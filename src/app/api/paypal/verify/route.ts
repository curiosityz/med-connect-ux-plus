import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { upsertUserPayment } from '@/services/databaseService';
import { clerkClient } from '@clerk/nextjs/server';

// Configure PayPal environment
const environment = new checkoutNodeJssdk.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID!,
  process.env.PAYPAL_SECRET!
);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

export async function POST(req: NextRequest) {
  console.log('VERIFY_PAYMENT_ROUTE: POST handler invoked');
  const authResult = await getAuth(req);
  if (!authResult || !authResult.userId) {
    console.log('VERIFY_PAYMENT_ROUTE: User not authenticated');
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }
  const { userId } = authResult;
  console.log(`VERIFY_PAYMENT_ROUTE: User authenticated: ${userId}`);

  try {
    const { orderID, planType, amount } = await req.json();
    console.log('VERIFY_PAYMENT_ROUTE: Request body parsed:', { orderID, planType, amount });

    if (!orderID || !planType || !amount) {
      console.log('VERIFY_PAYMENT_ROUTE: Missing orderID, planType, or amount');
      return NextResponse.json(
        { error: 'Missing orderID, planType, or amount' },
        { status: 400 }
      );
    }

    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    // @ts-expect-error PayPal SDK type definitions are stricter than API requirements for simple capture.
    request.requestBody({});

    console.log(`VERIFY_PAYMENT_ROUTE: Attempting to capture PayPal order: ${orderID}`);
    const capture = await client.execute(request);
    console.log('VERIFY_PAYMENT_ROUTE: PayPal order capture successful. Capture ID:', capture.result.id);

    if (capture.result.status !== 'COMPLETED') {
        console.error('VERIFY_PAYMENT_ROUTE: PayPal payment not completed. Status:', capture.result.status);
        return NextResponse.json({ error: 'PayPal payment not completed.', details: capture.result }, { status: 400 });
    }

    console.log('VERIFY_PAYMENT_ROUTE: Upserting user payment to DB');
    await upsertUserPayment({
      user_id: userId,
      plan: planType,
      status: 'completed',
      payment_id: orderID,
      amount: parseFloat(amount),
      currency: 'USD'
    });
    console.log('VERIFY_PAYMENT_ROUTE: User payment upserted to DB successfully');

    console.log('VERIFY_PAYMENT_ROUTE: Updating Clerk user metadata');
    const clerk = await clerkClient(); 
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        paymentPlan: planType,
        paymentDate: new Date().toISOString().split('T')[0],
        paypalOrderId: orderID,
      },
    });
    console.log('VERIFY_PAYMENT_ROUTE: Clerk user metadata updated successfully');

    return NextResponse.json(
        { 
            message: 'Payment verified and recorded successfully', 
            orderId: orderID, 
            paypalCaptureId: capture.result.id 
        }, 
        { status: 200 }
    );
  } catch (error: any) {
    console.error('VERIFY_PAYMENT_ROUTE: Error during payment verification:', error);
    if (error.isAxiosError) { 
        console.error('VERIFY_PAYMENT_ROUTE: PayPal API Error Details:', error.response?.data);
    } else if (error.message && error.message.includes('relation \"app_schema.user_payments\" does not exist')) {
        console.error('VERIFY_PAYMENT_ROUTE: Database connection or table issue. Ensure DB env vars are set correctly and table app_schema.user_payments exists and app user has permissions.');
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error during payment verification', 
        details: error.message || 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}
