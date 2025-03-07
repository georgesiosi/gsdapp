/**
 * Polar.sh webhook endpoint
 * Handles license events and updates
 */
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createHmac } from 'crypto';
import { PolarWebhookEvent, PolarEventType, WebhookValidation } from '@/services/license/types';

function validatePolarSignature(signature: string | null, timestamp: string | null, body: string): WebhookValidation {
  if (!signature) {
    return { isValid: false, error: 'Missing signature' };
  }
  
  if (!timestamp) {
    return { isValid: false, error: 'Missing timestamp' };
  }
  
  const apiKey = process.env.POLAR_API_KEY;
  if (!apiKey) {
    return { isValid: false, error: 'API key not configured' };
  }

  // Check timestamp freshness
  const timestampMs = parseInt(timestamp, 10);
  const now = Date.now();
  // More lenient validation in development (1 hour), strict in production (5 minutes)
  const maxAge = process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 60 * 60 * 1000;
  if (Math.abs(now - timestampMs) > maxAge) {
    return { isValid: false, error: 'Timestamp too old' };
  }

  // Compute expected signature
  const signaturePayload = timestamp + '.' + body;
  const hmac = createHmac('sha256', apiKey);
  hmac.update(signaturePayload);
  const expectedSignature = hmac.digest('hex');

  return {
    isValid: signature === expectedSignature,
    error: signature !== expectedSignature ? 'Invalid signature' : undefined
  };
}

export async function POST(request: Request) {
  try {
    // Get request body as text for signature validation
    const body = await request.text();
    const event: PolarWebhookEvent = JSON.parse(body);

    // Validate Polar signature
    const headersList = await request.headers;
    const signature = headersList.get('x-polar-signature');
    const timestamp = headersList.get('x-polar-timestamp');
    
    const validation = validatePolarSignature(signature, timestamp, body);
    if (!validation.isValid) {
      console.warn('[Polar Webhook] Validation failed:', validation.error);
      return NextResponse.json({ error: validation.error }, { status: 401 });
    }

    // Log full webhook event for debugging
    console.log('[Polar Webhook] Received event:', {
      type: event.type,
      timestamp: timestamp,
      data: event.data,
      headers: {
        signature: signature?.substring(0, 8) + '...',  // Only log part of the signature
        timestamp: timestamp
      }
    });

    // Validate event data
    if (!event.data.subscription && event.type.startsWith('subscription.')) {
      console.warn('[Polar Webhook] Missing subscription data for subscription event');
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
    }

    // Handle different event types
    switch (event.type as PolarEventType) {
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active':
        if (!event.data.subscription) {
          throw new Error('Subscription data missing from event');
        }
        // TODO: Update subscription status in database
        console.log('[Polar Webhook] Subscription active:', {
          id: event.data.subscription.id,
          status: event.data.subscription.status,
          validUntil: event.data.subscription.endDate
        });
        break;

      case 'subscription.canceled':
      case 'subscription.revoked':
        if (!event.data.subscription?.id) {
          throw new Error('Subscription ID missing from event');
        }
        // TODO: Handle subscription cancellation/revocation
        console.log('[Polar Webhook] Subscription ended:', {
          id: event.data.subscription.id,
          status: event.data.subscription.status,
          endDate: event.data.subscription.endDate
        });
        break;

      case 'subscription.uncanceled':
        if (!event.data.subscription) {
          throw new Error('Subscription data missing from event');
        }
        // TODO: Handle subscription reactivation
        console.log('[Polar Webhook] Subscription reactivated:', {
          id: event.data.subscription.id,
          status: event.data.subscription.status
        });
        break;

      default:
        console.warn('[Polar Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[Polar Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
