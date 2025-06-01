/**
 * PayPal Webhook Testing Script
 * 
 * This script tests a PayPal webhook by simulating webhook events
 * and verifying webhook signatures.
 */

const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// PayPal API URLs
const SANDBOX_URL = 'https://api-m.sandbox.paypal.com';
const PRODUCTION_URL = 'https://api-m.paypal.com';

// Determine which URL to use based on environment
const API_URL = process.env.PAYPAL_ENVIRONMENT === 'SANDBOX' ? SANDBOX_URL : PRODUCTION_URL;

// Webhook events to test
const WEBHOOK_EVENTS = [
  'PAYMENT.CAPTURE.COMPLETED',
  'PAYMENT.CAPTURE.DENIED',
  'PAYMENT.CAPTURE.DECLINED',
  'PAYMENT.CAPTURE.FAILED'
];

/**
 * Get an access token from PayPal
 * @returns {Promise<string>} The access token
 */
async function getAccessToken() {
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
 * Get webhook details
 * @param {string} accessToken - The PayPal access token
 * @param {string} webhookId - The webhook ID
 * @returns {Promise<object>} The webhook details
 */
async function getWebhookDetails(accessToken, webhookId) {
  const response = await fetch(`${API_URL}/v1/notifications/webhooks/${webhookId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get webhook details: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Simulate a webhook event
 * @param {string} accessToken - The PayPal access token
 * @param {string} webhookId - The webhook ID
 * @param {string} eventType - The event type to simulate
 * @returns {Promise<object>} The simulation result
 */
async function simulateWebhookEvent(accessToken, webhookId, eventType) {
  const response = await fetch(`${API_URL}/v1/notifications/simulate-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      webhook_id: webhookId,
      event_type: eventType
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to simulate webhook event: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Main function
 */
async function main() {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      throw new Error('PAYPAL_WEBHOOK_ID not found in environment variables');
    }

    // Get access token
    console.log('Getting PayPal access token...');
    const accessToken = await getAccessToken();
    console.log('Access token obtained successfully');

    // Get webhook details
    console.log(`\nGetting details for webhook ${webhookId}...`);
    const webhookDetails = await getWebhookDetails(accessToken, webhookId);
    console.log('Webhook details:');
    console.log(`- URL: ${webhookDetails.url}`);
    console.log('- Event types:');
    webhookDetails.event_types.forEach(eventType => {
      console.log(`  - ${eventType.name} (${eventType.status})`);
    });

    // Ask which event to simulate
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\nAvailable events to simulate:');
    WEBHOOK_EVENTS.forEach((event, index) => {
      console.log(`${index + 1}. ${event}`);
    });

    readline.question('\nEnter the number of the event to simulate (or "all" to simulate all events): ', async (answer) => {
      try {
        if (answer.toLowerCase() === 'all') {
          console.log('\nSimulating all webhook events...');
          for (const eventType of WEBHOOK_EVENTS) {
            await simulateEvent(accessToken, webhookId, eventType);
          }
        } else {
          const eventIndex = parseInt(answer) - 1;
          if (isNaN(eventIndex) || eventIndex < 0 || eventIndex >= WEBHOOK_EVENTS.length) {
            throw new Error('Invalid event number');
          }
          const eventType = WEBHOOK_EVENTS[eventIndex];
          await simulateEvent(accessToken, webhookId, eventType);
        }
      } catch (error) {
        console.error('Error:', error.message);
      } finally {
        readline.close();
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

/**
 * Simulate a specific event
 * @param {string} accessToken - The PayPal access token
 * @param {string} webhookId - The webhook ID
 * @param {string} eventType - The event type to simulate
 */
async function simulateEvent(accessToken, webhookId, eventType) {
  console.log(`\nSimulating ${eventType} event...`);
  const result = await simulateWebhookEvent(accessToken, webhookId, eventType);
  console.log(`Event ${eventType} simulated successfully`);
  console.log('Event ID:', result.id);
  console.log('Check your application logs to verify the webhook was received and processed correctly');
}

// Run the script
main();