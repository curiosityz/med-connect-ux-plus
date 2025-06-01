// Demo script for PayPal Agent Toolkit MCP Server
require('dotenv').config();
const { Client } = require('@anthropic-ai/sdk');

// Initialize Anthropic client (you would need to add ANTHROPIC_API_KEY to your .env file)
const anthropic = new Client({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy-key-for-demo',
});

async function runDemo() {
  console.log('Demonstrating PayPal Agent Toolkit MCP Server...');
  console.log('');
  console.log('This script simulates how an AI assistant would interact with the PayPal MCP server.');
  console.log('In a real scenario, the AI would use the MCP server to call PayPal APIs.');
  console.log('');
  
  console.log('Example 1: Listing PayPal invoices');
  console.log('AI prompt: "List my recent PayPal invoices"');
  console.log('');
  console.log('The AI would use the PayPal MCP server to call the list_invoices tool:');
  console.log(`
  {
    "name": "list_invoices",
    "parameters": {
      "page": 1,
      "page_size": 10,
      "total_count_required": true
    }
  }
  `);
  console.log('Note: Using PRODUCTION environment');
  console.log('');
  
  console.log('Example 2: Creating a PayPal invoice');
  console.log('AI prompt: "Create a PayPal invoice for 00 for web development services"');
  console.log('');
  console.log('The AI would use the PayPal MCP server to call the create_invoice tool:');
  console.log(`
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
  `);
  console.log('');
  
  console.log('To use the PayPal MCP server with a real AI assistant:');
  console.log('1. Ensure the MCP server is running (use ./run.sh)');
  console.log('2. Configure your AI assistant to use the MCP server');
  console.log('3. Ask the AI assistant to perform PayPal-related tasks');
  console.log('');
  
  console.log('Demo completed successfully! ✓');
}

runDemo().catch(console.error);
