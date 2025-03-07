/**
 * License validation service
 * Provides a clean interface for license validation while keeping provider details isolated
 */

import { LicenseProvider, LicenseValidation } from './types';

export class LicenseService {
  private static instance: LicenseService;
  private provider: LicenseProvider;

  private constructor(provider: LicenseProvider) {
    this.provider = provider;
  }

  static initialize(provider: LicenseProvider): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService(provider);
    }
    return LicenseService.instance;
  }

  static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      throw new Error('LicenseService not initialized');
    }
    return LicenseService.instance;
  }

  async validateLicense(licenseKey: string | null): Promise<LicenseValidation> {
    if (!licenseKey) {
      return {
        isValid: false,
        type: 'trial'
      };
    }

    // Handle legacy access
    if (licenseKey === 'LEGACY_ACCESS') {
      return {
        isValid: true,
        type: 'legacy'
      };
    }

    try {
      return await this.provider.validateLicense(licenseKey);
    } catch (error) {
      console.error('License validation error:', error);
      return {
        isValid: false,
        type: 'trial'
      };
    }
  }
}
