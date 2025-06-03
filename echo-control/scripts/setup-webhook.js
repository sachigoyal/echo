// Load environment variables from .env
require('dotenv').config({ path: '.env' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setupWebhook() {
  try {
    // The webhook endpoint URL - you'll need to replace this with your actual domain
    const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/stripe/webhook';
    
    console.log('Setting up webhook endpoint...');
    
    // List existing webhooks first
    const existingWebhooks = await stripe.webhookEndpoints.list();
    console.log(`Found ${existingWebhooks.data.length} existing webhooks`);
    
    // Check if our webhook already exists
    const existingWebhook = existingWebhooks.data.find(webhook => 
      webhook.url === webhookUrl
    );
    
    if (existingWebhook) {
      console.log('Webhook endpoint already exists:', existingWebhook.id);
      console.log('Webhook secret:', existingWebhook.secret);
      return existingWebhook;
    }
    
    // Create new webhook endpoint
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'checkout.session.completed',
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'invoice.payment_succeeded',
      ],
      description: 'Echo Control Webhook for Payment Processing'
    });
    
    console.log('Webhook endpoint created successfully!');
    console.log('Webhook ID:', webhook.id);
    console.log('Webhook URL:', webhook.url);
    console.log('Webhook Secret:', webhook.secret);
    console.log('\nAdd this to your environment variables:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
    
    return webhook;
  } catch (error) {
    console.error('Error setting up webhook:', error.message);
    throw error;
  }
}

// Run the setup
setupWebhook().catch(console.error); 