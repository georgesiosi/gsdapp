/**
 * License validation types and interfaces
 */

export type LicenseType = 'legacy' | 'paid' | 'trial';

export interface LicenseValidation {
  isValid: boolean;
  type: LicenseType;
  expiresAt?: Date;
}

export interface LicenseProvider {
  validateLicense(licenseKey: string): Promise<LicenseValidation>;
}

/**
 * Polar webhook event types
 */
export type PolarEventType = 
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.active'
  | 'subscription.canceled'
  | 'subscription.uncanceled'
  | 'subscription.revoked';

export interface PolarSubscription {
  id: string;
  status: 'active' | 'canceled' | 'revoked';
  customerId: string;
  planId: string;
  startDate: string;
  endDate?: string;
}

export interface PolarWebhookEvent {
  type: PolarEventType;
  data: {
    subscription?: PolarSubscription;
  };
}

/**
 * Webhook security types
 */
export interface WebhookHeaders {
  'x-polar-signature': string;
  'x-polar-timestamp': string;
}

export interface WebhookValidation {
  isValid: boolean;
  error?: string;
}
