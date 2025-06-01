#!/bin/bash

echo "PayPal Agent Toolkit MCP Server Demo"
echo "=================================="
echo ""

# Check if setup has been run
ENV_FILE="$(pwd)/.env"
if [ ! -f "$ENV_FILE" ] || ! grep -q "PAYPAL_ACCESS_TOKEN" "$ENV_FILE" || [ -z "$(grep "PAYPAL_ACCESS_TOKEN" "$ENV_FILE" | cut -d '=' -f 2)" ]; then
    echo "PayPal access token not found. Running setup script..."
    bash "$(pwd)/mcp/paypal-agent-toolkit/setup.sh"
    
    # Check if setup was successful
    if [ ! -f "$ENV_FILE" ] || ! grep -q "PAYPAL_ACCESS_TOKEN" "$ENV_FILE" || [ -z "$(grep "PAYPAL_ACCESS_TOKEN" "$ENV_FILE" | cut -d '=' -f 2)" ]; then
        echo "Setup failed. Please run the setup script manually and ensure you have a valid access token."
        exit 1
    fi
fi

echo "PayPal access token found. ✓"
echo ""

echo "Demonstrating PayPal Agent Toolkit MCP Server..."
echo ""
echo "This demo shows how an AI assistant would interact with the PayPal MCP server."
echo "In a real scenario, the AI would use the MCP server to call PayPal APIs."
echo ""

echo "Example 1: Listing PayPal invoices"
echo "AI prompt: \"List my recent PayPal invoices\""
echo ""
echo "The AI would use the PayPal MCP server to call the list_invoices tool:"
echo "
{
  \"name\": \"list_invoices\",
  \"parameters\": {
    \"page\": 1,
    \"page_size\": 10,
    \"total_count_required\": true
  }
}
"
echo "Note: Using PRODUCTION environment"
echo ""

echo "Example 2: Creating a PayPal invoice"
echo "AI prompt: \"Create a PayPal invoice for $100 for web development services\""
echo ""
echo "The AI would use the PayPal MCP server to call the create_invoice tool:"
echo "
{
  \"name\": \"create_invoice\",
  \"parameters\": {
    \"invoice\": {
      \"detail\": {
        \"invoice_number\": \"INV-2025-001\",
        \"reference\": \"REF-2025-001\",
        \"invoice_date\": \"2025-05-31\",
        \"currency_code\": \"USD\",
        \"note\": \"Thank you for your business!\",
        \"term\": \"Net 30\",
        \"memo\": \"Web Development Services\"
      },
      \"invoicer\": {
        \"name\": {
          \"given_name\": \"John\",
          \"surname\": \"Doe\"
        },
        \"address\": {
          \"address_line_1\": \"123 Main St\",
          \"admin_area_2\": \"San Jose\",
          \"admin_area_1\": \"CA\",
          \"postal_code\": \"95131\",
          \"country_code\": \"US\"
        },
        \"email_address\": \"john@example.com\",
        \"phones\": [
          {
            \"country_code\": \"1\",
            \"national_number\": \"4085551234\",
            \"phone_type\": \"MOBILE\"
          }
        ]
      },
      \"primary_recipients\": [
        {
          \"billing_info\": {
            \"name\": {
              \"given_name\": \"Jane\",
              \"surname\": \"Smith\"
            },
            \"address\": {
              \"address_line_1\": \"456 Oak St\",
              \"admin_area_2\": \"San Francisco\",
              \"admin_area_1\": \"CA\",
              \"postal_code\": \"94107\",
              \"country_code\": \"US\"
            },
            \"email_address\": \"jane@example.com\"
          }
        }
      ],
      \"items\": [
        {
          \"name\": \"Web Development\",
          \"description\": \"Professional web development services\",
          \"quantity\": \"1\",
          \"unit_amount\": {
            \"currency_code\": \"USD\",
            \"value\": \"100.00\"
          }
        }
      ]
    }
  }
}
"
echo ""

echo "Example 3: Retrieving dispute information"
echo "AI prompt: \"Show me my PayPal disputes\""
echo ""
echo "The AI would use the PayPal MCP server to call the list_disputes tool:"
echo "
{
  \"name\": \"list_disputes\",
  \"parameters\": {
    \"page\": 1,
    \"page_size\": 10
  }
}
"
echo ""

echo "To use the PayPal MCP server with your AI assistant:"
echo "1. Run the MCP server: bash $(pwd)/mcp/paypal-agent-toolkit/run.sh"
echo "2. Configure your AI assistant to use the MCP server"
echo "3. Ask your AI assistant to perform PayPal-related tasks"
echo ""
echo "Demo completed successfully! ✓"