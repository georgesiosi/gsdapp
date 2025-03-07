/**
 * Types for user profile and preferences
 */

export interface UserProfile {
  name: string;
  email: string;
  theme: 'light' | 'dark' | 'system';
  personalContext: string; // Freeform text for AI context
  licenseKey?: string;
  isLegacyUser?: boolean; // For existing users before license implementation
  licenseStatus?: 'legacy' | 'active' | 'inactive';
}

export interface ProfileFormData {
  name: string;
  email: string;
  theme: 'light' | 'dark' | 'system';
  personalContext: string;
  licenseKey?: string;
}
