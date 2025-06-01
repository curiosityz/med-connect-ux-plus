# PayPal Agent Toolkit MCP Server (Production)

This project integrates the [PayPal Agent Toolkit](https://github.com/paypal/agent-toolkit) as a Model Context Protocol (MCP) server, allowing AI assistants to interact with PayPal APIs through function calling. This setup uses the PayPal PRODUCTION environment.

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

1. Run the setup script:
   ```bash
   ./mcp/paypal-agent-toolkit/setup.sh
   ```

   This script will:
   - Check if Node.js (version 18+) is installed
   - Look for existing PayPal credentials in your .env file
   - Generate a PayPal access token if credentials are found
   - Create or update the .env file with the access token

2. If you don't have existing PayPal credentials, the script will guide you through generating an access token manually.

## Running the Server

Run the server using:
```bash
./mcp/paypal-agent-toolkit/run.sh
```

The server will start and be available to MCP-compatible tools like Claude Desktop, Cursor, or Cline.

## Demo

To see a demonstration of how the PayPal MCP server works:
```bash
./mcp/paypal-agent-toolkit/demo.sh
```

This will show examples of how an AI assistant would use the PayPal MCP server to perform tasks like listing invoices and creating new invoices.

## Configuration

The MCP server is configured in `mcp_settings.json` with the server name `github.com/paypal/agent-toolkit`.

## Detailed Documentation

For more detailed documentation, see:
- [PayPal Agent Toolkit MCP Server README](./mcp/paypal-agent-toolkit/README.md)
- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [Model Context Protocol](https://modelcontextprotocol.com/)

## Available Tools

The PayPal Agent Toolkit provides various tools for interacting with PayPal APIs. Some of the key tools include:

### Invoices
- `create_invoice`: Create a new invoice
- `list_invoices`: List invoices with pagination and filtering
- `send_invoice`: Send an invoice to recipients

### Payments
- `create_order`: Create a payment order
- `get_order`: Retrieve order details
- `pay_order`: Process payment for an order

### Products and Subscriptions
- `create_product`: Create a new product
- `list_products`: List products in your catalog
- `create_subscription_plan`: Create a subscription plan
- `create_subscription`: Create a new subscription

For a complete list of available tools, see the [detailed README](./mcp/paypal-agent-toolkit/README.md).