import { NextResponse, NextRequest } from 'next/server';
import { upsertUserPayment } from '@/services/databaseService';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { clerkClient as _clerkClient } from '@clerk/nextjs/server';

// Configure PayPal environment
const environment = new checkoutNodeJssdk.core.LiveEnvironment(
  process.env.PAYPAL_CLIENT_ID!, // Corrected: Use non-public env var for server-side
  process.env.PAYPAL_SECRET!
);
const client = new checkoutNodeJssdk.core.PayPalHttpClient(environment);

const getClerkClient = _clerkClient; // This is a function that returns a promise

// TODO: Use @paypal/checkout-server-sdk or @paypal/paypal-server-sdk for verification
// and update user payment status in DB or Clerk metadata

export async function POST(req: NextRequest) {
  try {
    // Implement proper webhook signature verification for production
    const headers = Object.fromEntries(req.headers.entries());
    const rawBody = await req.text(); // req.text() consumes the body
    const verificationStatus = await verifyPayPalWebhookSignature(headers, rawBody);
    
    if (!verificationStatus.isValid) {
      console.warn('Webhook signature validation failed.');
      return NextResponse.json({ error: 'Webhook signature validation failed' }, { status: 403 });
    }
    
    const event = verificationStatus.eventBody; // Use the body from verification
    const eventType = event.event_type;
    const resource = event.resource;

    console.log(`Received PayPal webhook event: ${eventType}`);

    // Handle different event types
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        const userId = resource?.custom_id;
        const orderId = resource?.id;
        // Ensure purchase_units exists and has at least one item before accessing description
        const planType = resource?.purchase_units?.[0]?.description || 'Unknown Plan';
        const paymentDate = new Date().toISOString().split('T')[0];

        if (!userId) {
          console.error('Webhook Error: Missing userId (custom_id) in PayPal resource for PAYMENT.CAPTURE.COMPLETED.');
          return NextResponse.json({ error: 'Missing userId in PayPal custom_id' }, { status: 400 });
        }
        if (!orderId) {
          console.error('Webhook Error: Missing orderId in PayPal resource for PAYMENT.CAPTURE.COMPLETED.');
          return NextResponse.json({ error: 'Missing orderId in PayPal resource' }, { status: 400 });
        }

        await upsertUserPayment({
          user_id: userId,
          plan: planType,
          status: 'completed',
          payment_id: orderId,
        });
        console.log(`Payment for order ${orderId} (user ${userId}, plan ${planType}) marked as completed in DB.`);

        try {
          const clerk = await getClerkClient(); // Call the function to get the client instance
          await clerk.users.updateUserMetadata(userId, {
            publicMetadata: {
              paymentPlan: planType,
              paymentDate: paymentDate,
              paypalOrderId: orderId,
            }
          });
          console.log(`Clerk user ${userId} publicMetadata updated for successful payment.`);
        } catch (clerkError) {
          console.error(`Clerk user metadata update error for user ${userId}:`, clerkError);
          // Log and continue, as payment is recorded in DB
        }
        break;

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
      case 'PAYMENT.CAPTURE.FAILED': // Added FAILED for completeness
        const failedUserId = resource?.custom_id;
        const failedOrderId = resource?.id;
        const failedPlanType = resource?.purchase_units?.[0]?.description || 'Unknown Plan';

        if (!failedUserId) {
          console.warn('Webhook Warning: Missing failedUserId (custom_id) in PayPal resource for failed/denied payment.');
          // Don't necessarily return error to PayPal, but log it.
          break; 
        }
        if (!failedOrderId) {
          console.warn('Webhook Warning: Missing failedOrderId in PayPal resource for failed/denied payment.');
          break;
        }

        await upsertUserPayment({
          user_id: failedUserId,
          plan: failedPlanType,
          status: eventType.split('.').pop()?.toLowerCase() || 'failed', // e.g., 'denied', 'declined', 'failed'
          payment_id: failedOrderId,
        });
        console.log(`Payment for order ${failedOrderId} (user ${failedUserId}, plan ${failedPlanType}) marked as ${eventType} in DB.`);

        try {
          const clerk = await getClerkClient();
          const { publicMetadata } = await clerk.users.getUser(failedUserId);
          await clerk.users.updateUserMetadata(failedUserId, {
            publicMetadata: {
              ...publicMetadata, // Preserve existing metadata
              paymentPlan: null, // Or handle plan based on your logic, e.g. downgrade
              paymentDate: null,
              lastPaypalOrderId: failedOrderId,
              lastPaymentAttemptStatus: eventType.split('.').pop()?.toLowerCase() || 'failed',
              lastPaymentAttemptDate: new Date().toISOString().split('T')[0],
            }
          });
          console.log(`Clerk user ${failedUserId} publicMetadata updated for failed/denied payment.`);
        } catch (clerkError) {
          console.error(`Clerk user metadata update error for user ${failedUserId} (failed/denied payment):`, clerkError);
        }
        break;

      default:
        console.log(`Unhandled PayPal event type: ${eventType}. Resource:`, JSON.stringify(resource, null, 2));
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Check if error is due to JSON parsing (e.g., if req.text() was used above and then req.json() is attempted)
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json(
            { error: 'Invalid JSON payload received for webhook' }, 
            { status: 400 }
        );
    }
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown server error'
      }, 
      { status: 500 }
    );
  }
}

// PayPal webhook verification implementation using REST API directly
async function verifyPayPalWebhookSignature(headers: Record<string, string>, rawBody: string): Promise<{isValid: boolean, eventBody?: any}> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error('PayPal Webhook ID is not configured.');
    return { isValid: false };
  }
  
  try {
    // Extract required headers for verification
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionTime = headers['paypal-transmission-time'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const authAlgo = headers['paypal-auth-algo'];
    const certUrl = headers['paypal-cert-url'];
    
    if (!transmissionId || !transmissionTime || !transmissionSig || !authAlgo || !certUrl) {
      console.error('Missing required PayPal webhook headers for verification');
      return { isValid: false };
    }
    
    // Create a request to PayPal's verify-webhook-signature API
    const verifyRequest = {
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody)
    };
    
    // Make a direct request to PayPal's API to verify the signature
    const response = await fetch('https://api-m.paypal.com/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAccessToken()}`
      },
      body: JSON.stringify(verifyRequest)
    });
    
    if (!response.ok) {
      console.error('Failed to verify webhook signature with PayPal API:', await response.text());
      return { isValid: false };
    }
    
    const result = await response.json();
    const verificationStatus = result.verification_status;
    const isSignatureValid = verificationStatus === 'SUCCESS';
    
    if (isSignatureValid) {
      return { isValid: true, eventBody: JSON.parse(rawBody) };
    } else {
      console.warn(`Webhook signature verification failed with status: ${verificationStatus}`);
      return { isValid: false };
    }
  } catch (err) {
    console.error('Error during webhook signature verification:', err);
    return { isValid: false };
  }
}

// Helper function to get a PayPal access token
async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_SECRET!;
  
  const response = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: 'grant_type=client_credentials'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get PayPal access token: ${await response.text()}`);
  }
  
  const data = await response.json();
  return data.access_token;
}