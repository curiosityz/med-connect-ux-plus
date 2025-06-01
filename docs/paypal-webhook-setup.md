# Setting Up PayPal Webhooks

This guide will walk you through the process of setting up PayPal webhooks for your application.

## Prerequisites

1. A PayPal Business account
2. Access to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)

## Step 1: Create a Webhook in the PayPal Developer Dashboard

1. Log in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Navigate to the "My Apps & Credentials" section
3. Select your application (or create a new one if needed)
4. Scroll down to the "Webhooks" section
5. Click "Add Webhook"
6. Enter your webhook URL: `https://rxprescribers.com/api/paypal/webhook`
7. Select the following event types:
   - PAYMENT.CAPTURE.COMPLETED
   - PAYMENT.CAPTURE.DENIED
   - PAYMENT.CAPTURE.DECLINED
   - PAYMENT.CAPTURE.FAILED
8. Click "Save"

## Step 2: Get Your Webhook ID

1. After creating the webhook, PayPal will display the webhook details
2. Copy the "Webhook ID" value
3. Open your `.env` file
4. Update the `PAYPAL_WEBHOOK_ID` value with your webhook ID:
   ```
   PAYPAL_WEBHOOK_ID=your_webhook_id_here
   ```

## Step 3: Test Your Webhook

1. In the PayPal Developer Dashboard, navigate to your webhook
2. Click "Test Your Webhook"
3. Select an event type (e.g., PAYMENT.CAPTURE.COMPLETED)
4. Click "Send Test Event"
5. Check your application logs to verify that the webhook was received and processed correctly

## Step 4: Verify Webhook Signature

Your application is already set up to verify webhook signatures using the `verifyPayPalWebhookSignature` function in `src/app/api/paypal/webhook.ts`. This ensures that webhook events are actually coming from PayPal.

## Troubleshooting

If you encounter issues with your webhooks:

1. Verify that your webhook URL is publicly accessible
2. Check that your `PAYPAL_WEBHOOK_ID` is correctly set in your `.env` file
3. Ensure that your middleware allows the webhook endpoint to be accessed without authentication
4. Check your application logs for any errors related to webhook processing
5. Use the "Test Your Webhook" feature in the PayPal Developer Dashboard to send test events

## Additional Resources

- [PayPal Webhooks Documentation](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)
- [PayPal Webhook Event Reference](https://developer.paypal.com/docs/api-basics/notifications/webhooks/event-names/)