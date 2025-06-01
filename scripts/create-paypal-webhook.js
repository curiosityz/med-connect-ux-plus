/**
 * PayPal Webhook Creation Script
 * 
 * This script creates PayPal webhooks programmatically using the PayPal REST API.
 * It will create webhooks for the payment capture events needed by the application.
 */

const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// PayPal API URLs
const SANDBOX_URL = 'https://api-m.sandbox.paypal.com';
const PRODUCTION_URL = 'https://api-m.paypal.com';

// Determine which URL to use based on environment
const API_URL = process.env.PAYPAL_ENVIRONMENT === 'SANDBOX' ? SANDBOX_URL : PRODUCTION_URL;

// Webhook events to subscribe to
const WEBHOOK_EVENTS = [
  'PAYMENT.CAPTURE.COMPLETED',
  'PAYMENT.CAPTURE.DENIED',
  'PAYMENT.CAPTURE.DECLINED',
  'PAYMENT.CAPTURE.FAILED'
];

// Webhook URL from environment variable or default
const WEBHOOK_URL = process.env.WEBHOOKS_PAYPAL_PAYMENT_COMPLETED || 'https://rxprescribers.com/api/paypal/webhook';

/**
 * Get an access token from PayPal
 * @returns {Promise<string>} The access token
 */
async function getAccessToken() {
  // First try to use the existing access token from the .env file
  const existingToken = process.env.PAYPAL_ACCESS_TOKEN;
  if (existingToken) {
    console.log('Using existing access token from .env file');
    return existingToken;
  }

  // If no existing token, try to generate a new one
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal client ID or secret not found in environment variables');
  }
  
  console.log('Using client ID:', clientId.substring(0, 5) + '...');
  console.log('Using client secret:', clientSecret.substring(0, 5) + '...');

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${auth}`
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a webhook
 * @param {string} accessToken - The PayPal access token
 * @returns {Promise<object>} The webhook data
 */
async function createWebhook(accessToken) {
  const response = await fetch(`${API_URL}/v1/notifications/webhooks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      event_types: WEBHOOK_EVENTS.map(name => ({ name }))
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create webhook: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * List existing webhooks
 * @param {string} accessToken - The PayPal access token
 * @returns {Promise<object>} The webhooks data
 */
async function listWebhooks(accessToken) {
  const response = await fetch(`${API_URL}/v1/notifications/webhooks`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list webhooks: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Delete a webhook
 * @param {string} accessToken - The PayPal access token
 * @param {string} webhookId - The ID of the webhook to delete
 * @returns {Promise<void>}
 */
async function deleteWebhook(accessToken, webhookId) {
  const response = await fetch(`${API_URL}/v1/notifications/webhooks/${webhookId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete webhook: ${response.status} ${errorText}`);
  }

  console.log(`Webhook ${webhookId} deleted successfully`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Get access token
    console.log('Getting PayPal access token...');
    const accessToken = await getAccessToken();
    console.log('Access token obtained successfully');

    // List existing webhooks
    console.log('\nListing existing webhooks...');
    const webhooksData = await listWebhooks(accessToken);
    
    if (webhooksData.webhooks && webhooksData.webhooks.length > 0) {
      console.log(`Found ${webhooksData.webhooks.length} existing webhooks:`);
      webhooksData.webhooks.forEach(webhook => {
        console.log(`- ID: ${webhook.id}, URL: ${webhook.url}`);
        console.log('  Event types:');
        webhook.event_types.forEach(eventType => {
          console.log(`  - ${eventType.name}`);
        });
      });

      // Ask if user wants to delete existing webhooks
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('\nDo you want to delete existing webhooks? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          for (const webhook of webhooksData.webhooks) {
            await deleteWebhook(accessToken, webhook.id);
          }
          // Create new webhook after deleting existing ones
          await createNewWebhook(accessToken);
        } else {
          console.log('Keeping existing webhooks');
          // Create new webhook alongside existing ones
          await createNewWebhook(accessToken);
        }
        readline.close();
      });
    } else {
      console.log('No existing webhooks found');
      // Create new webhook since none exist
      await createNewWebhook(accessToken);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

/**
 * Create a new webhook
 * @param {string} accessToken - The PayPal access token
 */
async function createNewWebhook(accessToken) {
  console.log('\nCreating new webhook...');
  console.log(`URL: ${WEBHOOK_URL}`);
  console.log('Event types:');
  WEBHOOK_EVENTS.forEach(event => console.log(`- ${event}`));
  
  const webhookData = await createWebhook(accessToken);
  console.log('\nWebhook created successfully:');
  console.log(`- ID: ${webhookData.id}`);
  console.log(`- URL: ${webhookData.url}`);
  
  console.log('\nAdd this to your .env file:');
  console.log(`PAYPAL_WEBHOOK_ID=${webhookData.id}`);
}

// Run the script
main();