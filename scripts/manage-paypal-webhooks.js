/**
 * PayPal Webhook Management Script
 * 
 * This script provides utilities for managing PayPal webhooks:
 * - List all webhooks
 * - View webhook details
 * - Update webhook event subscriptions
 * - Delete webhooks
 */

const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// PayPal API URLs
const SANDBOX_URL = 'https://api-m.sandbox.paypal.com';
const PRODUCTION_URL = 'https://api-m.paypal.com';

// Determine which URL to use based on environment
const API_URL = process.env.PAYPAL_ENVIRONMENT === 'SANDBOX' ? SANDBOX_URL : PRODUCTION_URL;

// Available webhook events for payment capture
const PAYMENT_CAPTURE_EVENTS = [
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
 * List all webhooks
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
 * Update webhook event subscriptions
 * @param {string} accessToken - The PayPal access token
 * @param {string} webhookId - The webhook ID
 * @param {string[]} eventTypes - The event types to subscribe to
 * @returns {Promise<object>} The updated webhook data
 */
async function updateWebhookEvents(accessToken, webhookId, eventTypes) {
  const response = await fetch(`${API_URL}/v1/notifications/webhooks/${webhookId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify([
      {
        op: 'replace',
        path: '/event_types',
        value: eventTypes.map(name => ({ name }))
      }
    ])
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update webhook events: ${response.status} ${errorText}`);
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
 * List available webhook event types
 * @param {string} accessToken - The PayPal access token
 * @returns {Promise<object>} The event types data
 */
async function listEventTypes(accessToken) {
  const response = await fetch(`${API_URL}/v1/notifications/webhooks-event-types`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list event types: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Display menu and handle user input
 * @param {string} accessToken - The PayPal access token
 */
async function displayMenu(accessToken) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n=== PayPal Webhook Management ===');
  console.log('1. List all webhooks');
  console.log('2. View webhook details');
  console.log('3. Update webhook event subscriptions');
  console.log('4. Delete webhook');
  console.log('5. List available event types');
  console.log('6. Exit');

  readline.question('\nEnter your choice (1-6): ', async (answer) => {
    try {
      switch (answer) {
        case '1':
          await handleListWebhooks(accessToken, readline);
          break;
        case '2':
          await handleViewWebhookDetails(accessToken, readline);
          break;
        case '3':
          await handleUpdateWebhookEvents(accessToken, readline);
          break;
        case '4':
          await handleDeleteWebhook(accessToken, readline);
          break;
        case '5':
          await handleListEventTypes(accessToken, readline);
          break;
        case '6':
          console.log('Exiting...');
          readline.close();
          return;
        default:
          console.log('Invalid choice. Please try again.');
          await displayMenu(accessToken);
          break;
      }
    } catch (error) {
      console.error('Error:', error.message);
      await displayMenu(accessToken);
    }
  });
}

/**
 * Handle listing webhooks
 * @param {string} accessToken - The PayPal access token
 * @param {readline.Interface} readline - The readline interface
 */
async function handleListWebhooks(accessToken, readline) {
  console.log('\nListing webhooks...');
  const webhooksData = await listWebhooks(accessToken);
  
  if (webhooksData.webhooks && webhooksData.webhooks.length > 0) {
    console.log(`\nFound ${webhooksData.webhooks.length} webhooks:`);
    webhooksData.webhooks.forEach((webhook, index) => {
      console.log(`\n${index + 1}. ID: ${webhook.id}`);
      console.log(`   URL: ${webhook.url}`);
      console.log('   Event types:');
      webhook.event_types.forEach(eventType => {
        console.log(`   - ${eventType.name}`);
      });
    });
  } else {
    console.log('No webhooks found');
  }
  
  readline.question('\nPress Enter to return to the menu...', async () => {
    await displayMenu(accessToken);
  });
}

/**
 * Handle viewing webhook details
 * @param {string} accessToken - The PayPal access token
 * @param {readline.Interface} readline - The readline interface
 */
async function handleViewWebhookDetails(accessToken, readline) {
  readline.question('\nEnter webhook ID: ', async (webhookId) => {
    try {
      console.log(`\nGetting details for webhook ${webhookId}...`);
      const webhookDetails = await getWebhookDetails(accessToken, webhookId);
      
      console.log('\nWebhook details:');
      console.log(`ID: ${webhookDetails.id}`);
      console.log(`URL: ${webhookDetails.url}`);
      console.log('Event types:');
      webhookDetails.event_types.forEach(eventType => {
        console.log(`- ${eventType.name} (${eventType.status})`);
      });
      
      readline.question('\nPress Enter to return to the menu...', async () => {
        await displayMenu(accessToken);
      });
    } catch (error) {
      console.error('Error:', error.message);
      readline.question('\nPress Enter to return to the menu...', async () => {
        await displayMenu(accessToken);
      });
    }
  });
}

/**
 * Handle updating webhook event subscriptions
 * @param {string} accessToken - The PayPal access token
 * @param {readline.Interface} readline - The readline interface
 */
async function handleUpdateWebhookEvents(accessToken, readline) {
  readline.question('\nEnter webhook ID: ', async (webhookId) => {
    try {
      console.log(`\nGetting details for webhook ${webhookId}...`);
      const webhookDetails = await getWebhookDetails(accessToken, webhookId);
      
      console.log('\nCurrent event subscriptions:');
      webhookDetails.event_types.forEach((eventType, index) => {
        console.log(`${index + 1}. ${eventType.name} (${eventType.status})`);
      });
      
      console.log('\nAvailable payment capture events:');
      PAYMENT_CAPTURE_EVENTS.forEach((event, index) => {
        console.log(`${index + 1}. ${event}`);
      });
      
      readline.question('\nDo you want to subscribe to all payment capture events? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          console.log('\nUpdating webhook event subscriptions...');
          const updatedWebhook = await updateWebhookEvents(accessToken, webhookId, PAYMENT_CAPTURE_EVENTS);
          
          console.log('\nWebhook updated successfully:');
          console.log(`ID: ${updatedWebhook.id}`);
          console.log(`URL: ${updatedWebhook.url}`);
          console.log('Event types:');
          updatedWebhook.event_types.forEach(eventType => {
            console.log(`- ${eventType.name}`);
          });
        } else {
          console.log('Webhook event subscriptions not updated');
        }
        
        readline.question('\nPress Enter to return to the menu...', async () => {
          await displayMenu(accessToken);
        });
      });
    } catch (error) {
      console.error('Error:', error.message);
      readline.question('\nPress Enter to return to the menu...', async () => {
        await displayMenu(accessToken);
      });
    }
  });
}

/**
 * Handle deleting a webhook
 * @param {string} accessToken - The PayPal access token
 * @param {readline.Interface} readline - The readline interface
 */
async function handleDeleteWebhook(accessToken, readline) {
  readline.question('\nEnter webhook ID: ', async (webhookId) => {
    try {
      readline.question(`\nAre you sure you want to delete webhook ${webhookId}? (y/n): `, async (answer) => {
        if (answer.toLowerCase() === 'y') {
          console.log(`\nDeleting webhook ${webhookId}...`);
          await deleteWebhook(accessToken, webhookId);
          console.log('Webhook deleted successfully');
        } else {
          console.log('Webhook deletion cancelled');
        }
        
        readline.question('\nPress Enter to return to the menu...', async () => {
          await displayMenu(accessToken);
        });
      });
    } catch (error) {
      console.error('Error:', error.message);
      readline.question('\nPress Enter to return to the menu...', async () => {
        await displayMenu(accessToken);
      });
    }
  });
}

/**
 * Handle listing available event types
 * @param {string} accessToken - The PayPal access token
 * @param {readline.Interface} readline - The readline interface
 */
async function handleListEventTypes(accessToken, readline) {
  console.log('\nListing available event types...');
  const eventTypesData = await listEventTypes(accessToken);
  
  if (eventTypesData.event_types && eventTypesData.event_types.length > 0) {
    console.log(`\nFound ${eventTypesData.event_types.length} event types:`);
    eventTypesData.event_types.forEach((eventType, index) => {
      console.log(`\n${index + 1}. ${eventType.name}`);
      console.log(`   Description: ${eventType.description || 'N/A'}`);
      console.log(`   Status: ${eventType.status || 'N/A'}`);
    });
  } else {
    console.log('No event types found');
  }
  
  readline.question('\nPress Enter to return to the menu...', async () => {
    await displayMenu(accessToken);
  });
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

    // Display menu
    await displayMenu(accessToken);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();