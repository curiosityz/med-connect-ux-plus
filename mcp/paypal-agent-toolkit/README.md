# PayPal Agent Toolkit MCP Server (Production)

This directory contains the setup for the PayPal Agent Toolkit as a Model Context Protocol (MCP) server. The PayPal Agent Toolkit enables integration with PayPal APIs through function calling, providing tools for invoices, payments, dispute management, shipment tracking, catalog management, subscription management, and reporting.

**Note: This setup uses the PayPal PRODUCTION environment, not the sandbox environment.**

## Installation

1. Run the setup script:
   ```bash
   ./setup.sh
   ```

2. The setup script will:
   - Check if Node.js (version 18+) is installed
   - Create a `.env` file for storing your PayPal access token
   - Provide instructions for generating a PayPal access token

3. Generate a PayPal access token following the instructions provided by the setup script

4. Add your access token to the `.env` file:
   ```
   PAYPAL_ACCESS_TOKEN=your_access_token_here
   ```

## Running the Server

Run the server using the provided script:
```bash
./run.sh
```

The server will start and be available to MCP-compatible tools like Claude Desktop, Cursor, or Cline.

## Available Tools

The PayPal Agent Toolkit provides the following tools:

### Invoices
- `create_invoice`: Create a new invoice in the PayPal system
- `list_invoices`: List invoices with optional pagination and filtering
- `get_invoice`: Retrieve details of a specific invoice
- `send_invoice`: Send an invoice to recipients
- `send_invoice_reminder`: Send a reminder for an existing invoice
- `cancel_sent_invoice`: Cancel a sent invoice
- `generate_invoice_qr_code`: Generate a QR code for an invoice

### Payments
- `create_order`: Create an order in PayPal system based on provided details
- `get_order`: Retrieve the details of an order
- `pay_order`: Process payment for an authorized order

### Dispute Management
- `list_disputes`: Retrieve a summary of all open disputes
- `get_dispute`: Retrieve detailed information of a specific dispute
- `accept_dispute_claim`: Accept a dispute claim

### Shipment Tracking
- `create_shipment_tracking`: Create a shipment tracking record
- `get_shipment_tracking`: Retrieve shipment tracking information

### Catalog Management
- `create_product`: Create a new product in the PayPal catalog
- `list_products`: List products with optional pagination and filtering
- `show_product_details`: Retrieve details of a specific product

### Subscription Management
- `create_subscription_plan`: Create a new subscription plan
- `list_subscription_plans`: List subscription plans
- `show_subscription_plan_details`: Retrieve details of a specific subscription plan
- `create_subscription`: Create a new subscription
- `show_subscription_details`: Retrieve details of a specific subscription
- `cancel_subscription`: Cancel an active subscription

### Reporting and Insights
- `list_transactions`: List transactions with optional pagination and filtering

## Example Usage

Once the MCP server is running, you can use the tools through MCP-compatible applications. For example, in Claude Desktop, you might ask:

- "Create a PayPal invoice for $100 for web development services"
- "List my recent PayPal transactions"
- "Create a new product in my PayPal catalog"
- "Show details of my subscription plans"

## Troubleshooting

- **Access Token Expired**: PayPal access tokens expire after a few hours. If you encounter authentication errors, generate a new access token and update the `.env` file.
- **Connection Issues**: Ensure that the MCP server is running and that your MCP client is properly configured to connect to it.
- **Permission Errors**: Make sure your PayPal account has the necessary permissions for the operations you're trying to perform.

## Additional Resources

- [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
- [PayPal API Documentation](https://developer.paypal.com/docs/api/)
- [Model Context Protocol](https://modelcontextprotocol.com/)