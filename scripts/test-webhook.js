const crypto = require('crypto');

// Test event data
const event = {
  type: 'subscription.created',
  data: {
    subscription: {
      id: 'test-sub-123',
      status: 'active',
      customerId: 'test-customer',
      planId: 'test-plan',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
};

// Current timestamp
const timestamp = Date.now().toString();

// Create signature (timestamp.body)
const body = JSON.stringify(event);
const signaturePayload = timestamp + '.' + body;

// Calculate HMAC using the webhook secret
const hmac = crypto.createHmac('sha256', process.env.POLAR_API_KEY || '030f74a27e0344049548fbc76dd8fd02');
hmac.update(signaturePayload);
const signature = hmac.digest('hex');

console.log(`curl -X POST "${process.env.EXTERNAL_URL || 'https://484b-177-238-19-1.ngrok-free.app'}/api/webhooks/polar" \\
  -H "Content-Type: application/json" \\
  -H "x-polar-signature: ${signature}" \\
  -H "x-polar-timestamp: ${timestamp}" \\
  -d '${body}'`);
