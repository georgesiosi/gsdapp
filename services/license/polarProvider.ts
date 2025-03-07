/**
 * Polar.sh license validation implementation
 */

import { LicenseProvider, LicenseValidation } from './types';

export class PolarLicenseProvider implements LicenseProvider {
  constructor(private readonly apiKey: string) {}

  async validateLicense(licenseKey: string): Promise<LicenseValidation> {
    // TODO: Implement Polar.sh API validation
    // For now, return a mock response
    return {
      isValid: true,
      type: 'paid',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    };
  }
}
