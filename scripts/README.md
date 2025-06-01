# PayPal Webhook Management Scripts

This directory contains scripts for managing PayPal webhooks programmatically using the PayPal REST API.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PayPal Business account with API credentials

## Setup

1. Install dependencies:
   ```bash
   cd scripts
   npm install
   ```

2. Ensure your PayPal API credentials are set in the root `.env` file:
   ```
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id_here
   PAYPAL_SECRET=your_secret_here
   PAYPAL_ENVIRONMENT=PRODUCTION  # or SANDBOX for testing
   WEBHOOKS_PAYPAL_PAYMENT_COMPLETED=https://rxprescribers.com/api/paypal/webhook
   ```

## Available Scripts

### Create PayPal Webhook

This script creates a webhook in your PayPal account that subscribes to payment capture events. It will:

1. Get an access token using your PayPal credentials
2. List existing webhooks in your account
3. Ask if you want to delete existing webhooks
4. Create a new webhook with the specified event types

```bash
npm run create-webhook
```

The script will output the webhook ID, which you should add to your `.env` file:

```
PAYPAL_WEBHOOK_ID=your_webhook_id_here
```

### Test PayPal Webhook

This script tests your PayPal webhook by simulating webhook events. It will:

1. Get an access token using your PayPal credentials
2. Retrieve details about your webhook
3. Allow you to simulate specific webhook events or all events
4. Send test events to your webhook endpoint

```bash
npm run test-webhook
```

The script will prompt you to choose which event to simulate. After simulating an event, check your application logs to verify that the webhook was received and processed correctly.

### Manage PayPal Webhooks

This script provides a comprehensive interface for managing PayPal webhooks. It offers the following functionality:

1. List all webhooks in your PayPal account
2. View detailed information about a specific webhook
3. Update webhook event subscriptions
4. Delete webhooks
5. List all available webhook event types

```bash
npm run manage-webhooks
```

The script provides an interactive menu-driven interface for managing your webhooks.

### Features

- **Environment Detection**: Automatically uses the correct PayPal API URL based on your environment setting (SANDBOX or PRODUCTION)
- **Webhook Management**: Lists existing webhooks and offers to delete them before creating a new one
- **Event Subscription**: Subscribes to the following payment events:
  - PAYMENT.CAPTURE.COMPLETED
  - PAYMENT.CAPTURE.DENIED
  - PAYMENT.CAPTURE.DECLINED
  - PAYMENT.CAPTURE.FAILED
- **Event Simulation**: Simulates webhook events to test your webhook endpoint

## Troubleshooting

If you encounter issues:

1. Verify your PayPal API credentials are correct
2. Ensure your webhook URL is publicly accessible
3. Check that you have the necessary permissions in your PayPal account
4. For sandbox testing, make sure you're using sandbox credentials

## Additional Resources

- [PayPal REST API Documentation](https://developer.paypal.com/docs/api/overview/)
- [PayPal Webhooks Documentation](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)