#!/bin/bash

echo "PayPal Agent Toolkit MCP Server"
echo "=============================="
echo ""

# Check if .env file exists
ENV_FILE="$(pwd)/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    echo "Please run the setup script first: bash $(pwd)/mcp/paypal-agent-toolkit/setup.sh"
    exit 1
fi

# Source the .env file to load environment variables
source "$ENV_FILE"

# Check if PAYPAL_ACCESS_TOKEN is set
if [ -z "$PAYPAL_ACCESS_TOKEN" ]; then
    echo "Error: PAYPAL_ACCESS_TOKEN is not set in the .env file"
    echo "Please add your PayPal access token to the .env file"
    exit 1
fi

# Set default environment if not specified
if [ -z "$PAYPAL_ENVIRONMENT" ]; then
    PAYPAL_ENVIRONMENT="PRODUCTION"
fi

echo "Starting PayPal Agent Toolkit MCP Server..."
echo "Environment: $PAYPAL_ENVIRONMENT"
echo ""
echo "The server will be available to MCP-compatible tools like Claude Desktop, Cursor, or Cline."
echo "Press Ctrl+C to stop the server."
echo ""

# Start the MCP server with explicit command-line arguments
npx -y @paypal/mcp --tools=all --access-token="$PAYPAL_ACCESS_TOKEN" --paypal-environment="$PAYPAL_ENVIRONMENT"