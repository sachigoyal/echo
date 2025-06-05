# Stripe Webhook Setup Guide

This guide will help you set up Stripe webhooks to properly handle payment completion events from payment links.

## Overview

The webhook endpoint is located at `/api/stripe/webhook` and handles the following events:

- `checkout.session.completed` - Fires when payment link payments are completed
- `payment_intent.succeeded` - Fires when direct payments succeed
- `payment_intent.payment_failed` - Fires when payments fail
- `invoice.payment_succeeded` - Fires when invoice payments succeed

## Setup Steps

### 1. Make Your Webhook Endpoint Accessible

Your webhook endpoint must be publicly accessible via HTTPS. You have several options:

#### Option A: Deploy to Production

Deploy your application to a hosting service like Vercel, Netlify, or your own server.

#### Option B: Use ngrok for Local Development

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Note the HTTPS URL (e.g., https://abc123.ngrok.io)
```

#### Option C: Use Stripe CLI for Local Testing

```bash
# Install Stripe CLI
# Follow instructions at: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward events to your local endpoint
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Note the webhook signing secret from the output
```

### 2. Set Environment Variables

Add these to your `.env.local` file:

```env
# Required Stripe keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Webhook secret (you'll get this after creating the webhook)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Your app URL
NEXTAUTH_URL=https://yourdomain.com  # or your ngrok URL
```

### 3. Create the Webhook Endpoint

#### Option A: Use the Automated Script

```bash
# Set your webhook URL
export WEBHOOK_URL="https://yourdomain.com/api/stripe/webhook"

# Run the setup script
npm run setup-webhook
```

#### Option B: Manual Setup via Stripe Dashboard

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
5. Click "Add endpoint"
6. Copy the webhook signing secret

#### Option C: Use Stripe CLI (for development)

```bash
# This automatically creates a webhook and forwards events
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 4. Update Environment Variables

After creating the webhook, add the signing secret to your environment:

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### 5. Test the Webhook

#### Test with Stripe CLI

```bash
# Trigger a test event
stripe trigger checkout.session.completed
```

#### Test with a Real Payment Link

1. Create a payment link in your application
2. Complete a test payment
3. Check your application logs for webhook events
4. Verify the payment status is updated in your database

## Webhook Security

The webhook endpoint includes several security measures:

1. **Signature Verification**: Verifies that requests come from Stripe
2. **Timestamp Validation**: Prevents replay attacks
3. **Event Deduplication**: Handles duplicate events gracefully

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**

   - Ensure your endpoint is publicly accessible via HTTPS
   - Check that the webhook URL is correct in Stripe dashboard
   - Verify your server is running and responding to POST requests

2. **Signature verification failures**

   - Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
   - Make sure you're using the raw request body for verification
   - Check that your webhook secret matches the one in Stripe dashboard

3. **Events not being processed**
   - Check your application logs for errors
   - Ensure your database is accessible
   - Verify that the payment records exist in your database

### Debugging

Enable detailed logging by checking your application logs after making a payment:

```bash
# For Next.js development
npm run dev

# Check browser console and terminal output
```

### Webhook Event Flow

1. Customer completes payment via payment link
2. Stripe creates a checkout session
3. Stripe sends `checkout.session.completed` event to your webhook
4. Your webhook verifies the signature
5. Your webhook updates the payment status in the database
6. Credits are added to the user's account

## Production Considerations

1. **HTTPS Only**: Webhooks must use HTTPS in production
2. **Idempotency**: Handle duplicate events gracefully
3. **Error Handling**: Return appropriate HTTP status codes
4. **Logging**: Log webhook events for debugging
5. **Monitoring**: Set up alerts for webhook failures

## Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Payment Links Documentation](https://stripe.com/docs/payment-links)
