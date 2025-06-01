# Using the PayPal Agent Toolkit MCP Server

This guide will help you understand how to use the PayPal Agent Toolkit MCP server to interact with PayPal APIs.

## Overview

The PayPal Agent Toolkit MCP server provides tools for:

- Creating and managing invoices
- Processing payments
- Managing disputes
- Tracking shipments
- Managing products and catalogs
- Creating and managing subscriptions
- Accessing transaction reports

## Setup

1. Make sure you have Node.js (version 18+) installed
2. Run the setup script:
   ```bash
   ./mcp/paypal-agent-toolkit/setup.sh
   ```
3. The setup script will:
   - Check if Node.js is installed
   - Look for existing PayPal credentials in your .env file
   - Generate a PayPal access token if credentials are found
   - Create or update the .env file with the access token

## Running the Server

Run the server using:
```bash
./mcp/paypal-agent-toolkit/run.sh
```

The server will start and be available to MCP-compatible tools like Claude Desktop, Cursor, or Cline.

## Available Tools

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

Once the MCP server is running, you can use the tools through MCP-compatible applications. Here are some examples:

### Listing Invoices

```json
{
  "name": "list_invoices",
  "parameters": {
    "page": 1,
    "page_size": 10,
    "total_count_required": true
  }
}
```

### Creating an Invoice

```json
{
  "name": "create_invoice",
  "parameters": {
    "invoice": {
      "detail": {
        "invoice_number": "INV-2025-001",
        "reference": "REF-2025-001",
        "invoice_date": "2025-05-31",
        "currency_code": "USD",
        "note": "Thank you for your business!",
        "term": "Net 30",
        "memo": "Web Development Services"
      },
      "invoicer": {
        "name": {
          "given_name": "John",
          "surname": "Doe"
        },
        "address": {
          "address_line_1": "123 Main St",
          "admin_area_2": "San Jose",
          "admin_area_1": "CA",
          "postal_code": "95131",
          "country_code": "US"
        },
        "email_address": "john@example.com",
        "phones": [
          {
            "country_code": "1",
            "national_number": "4085551234",
            "phone_type": "MOBILE"
          }
        ]
      },
      "primary_recipients": [
        {
          "billing_info": {
            "name": {
              "given_name": "Jane",
              "surname": "Smith"
            },
            "address": {
              "address_line_1": "456 Oak St",
              "admin_area_2": "San Francisco",
              "admin_area_1": "CA",
              "postal_code": "94107",
              "country_code": "US"
            },
            "email_address": "jane@example.com"
          }
        }
      ],
      "items": [
        {
          "name": "Web Development",
          "description": "Professional web development services",
          "quantity": "1",
          "unit_amount": {
            "currency_code": "USD",
            "value": "100.00"
          }
        }
      ]
    }
  }
}
```

### Listing Disputes

```json
{
  "name": "list_disputes",
  "parameters": {
    "page": 1,
    "page_size": 10
  }
}
```

## Troubleshooting

- **Access Token Expired**: PayPal access tokens expire after a few hours. If you encounter authentication errors, generate a new access token and update the `.env` file.
- **Connection Issues**: Ensure that the MCP server is running and that your MCP client is properly configured to connect to it.
- **Permission Errors**: Make sure your PayPal account has the necessary permissions for the operations you're trying to perform.

## Additional Resources

- [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
- [PayPal API Documentation](https://developer.paypal.com/docs/api/)
- [Model Context Protocol](https://modelcontextprotocol.com/)