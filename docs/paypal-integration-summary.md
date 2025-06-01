# PayPal Integration Summary

This document provides an overview of the PayPal integration in this project.

## Components of the PayPal Integration

1. **PayPal API Endpoints**
   - `src/app/api/paypal/create-order.ts` - Creates PayPal orders
   - `src/app/api/paypal/verify.ts` - Verifies and captures PayPal payments
   - `src/app/api/paypal/webhook.ts` - Handles PayPal webhook events

2. **PayPal React Integration**
   - `src/app/pricing/PricingContent.tsx` - React component with PayPal buttons

3. **PayPal Agent Toolkit MCP Server**
   - `mcp/paypal-agent-toolkit/` - MCP server for PayPal API integration
   - `mcp_settings.json` - Configuration for the MCP server

4. **Environment Variables**
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID` - Client-side PayPal Client ID
   - `PAYPAL_SECRET` - Server-side PayPal Secret
   - `PAYPAL_WEBHOOK_ID` - PayPal Webhook ID for verification
   - `PAYPAL_ACCESS_TOKEN` - Access token for the MCP server
   - `PAYPAL_ENVIRONMENT` - Set to PRODUCTION

5. **Webhook Configuration**
   - Webhook URL: `https://rxprescribers.com/api/paypal/webhook`
   - Webhook events:
     - PAYMENT.CAPTURE.COMPLETED
     - PAYMENT.CAPTURE.DENIED
     - PAYMENT.CAPTURE.DECLINED
     - PAYMENT.CAPTURE.FAILED

## Setup and Configuration

1. **API Endpoints Setup**
   - The API endpoints are already implemented and ready to use
   - The middleware has been configured to allow the webhook endpoint to be accessed without authentication

2. **PayPal MCP Server Setup**
   - Run `./mcp/paypal-agent-toolkit/setup.sh` to set up the MCP server
   - Run `./mcp/paypal-agent-toolkit/run.sh` to start the MCP server

3. **Webhook Setup**
   - Follow the instructions in `docs/paypal-webhook-setup.md` to set up the webhook in the PayPal Developer Dashboard
   - Alternatively, use the scripts in the `scripts` directory to programmatically create and manage webhooks:
     ```bash
     cd scripts
     npm install
     npm run create-webhook  # Create a new webhook
     npm run test-webhook    # Test webhook by simulating events
     npm run manage-webhooks # Comprehensive webhook management
     ```

## Documentation

1. **PayPal Webhook Setup**
   - `docs/paypal-webhook-setup.md` - Guide for setting up PayPal webhooks

2. **PayPal MCP Server Usage**
   - `docs/paypal-mcp-usage.md` - Guide for using the PayPal MCP server

3. **PayPal React Integration**
   - `docs/paypal-react-integration.md` - Guide for integrating PayPal payments in React components

## Flow of a PayPal Payment

1. **Creating an Order**
   - User selects a plan on the pricing page
   - PayPal button is clicked
   - `createOrder` function is called
   - Request is sent to `/api/paypal/create-order`
   - Order is created in PayPal
   - Order ID is returned to the client

2. **Processing a Payment**
   - User completes payment in the PayPal popup
   - `onApprove` callback is triggered
   - Payment is captured using `actions.order.capture()`
   - Request is sent to `/api/paypal/verify`
   - Payment is verified and user's account is updated
   - Success message is shown to the user

3. **Webhook Processing**
   - PayPal sends a webhook event to `https://rxprescribers.com/api/paypal/webhook`
   - Webhook signature is verified
   - Event type is determined
   - User's payment status is updated in the database
   - User's metadata is updated in Clerk

## Troubleshooting

1. **PayPal API Issues**
   - Check the PayPal Developer Dashboard for API status
   - Verify that your PayPal credentials are correct
   - Check the application logs for any errors

2. **Webhook Issues**
   - Verify that your webhook URL is publicly accessible
   - Check that your `PAYPAL_WEBHOOK_ID` is correctly set in your `.env` file
   - Ensure that your middleware allows the webhook endpoint to be accessed without authentication
   - Check your application logs for any errors related to webhook processing
   - Use the "Test Your Webhook" feature in the PayPal Developer Dashboard to send test events
   - Alternatively, use the `npm run test-webhook` script to simulate webhook events

3. **MCP Server Issues**
   - Check that your `PAYPAL_ACCESS_TOKEN` is valid and not expired
   - Restart the MCP server if needed
   - Check the MCP server logs for any errors

4. **Webhook Management**
   - Use the `npm run manage-webhooks` script to:
     - List all webhooks in your PayPal account
     - View webhook details
     - Update webhook event subscriptions
     - Delete webhooks
     - List available event types

## Additional Resources

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Checkout Integration Guide](https://developer.paypal.com/docs/checkout/)
- [PayPal Webhooks Documentation](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)
- [PayPal React SDK Documentation](https://paypal.github.io/react-paypal-js/)