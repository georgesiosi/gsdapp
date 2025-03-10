---
last_updated: 2025-03-07
update_history:
  - 2025-03-07: Initial documentation
---

# Decision Record: Licensing Approach

## Date

2025-03-07

## Context

The application previously used a license key system via Polar.sh to manage user
access. With our transition to Clerk for authentication and Convex for cloud
storage, we need to modernize our approach to user access and subscriptions.

## Options Considered

### 1. Replace Licensing with Subscription-Only

* **Pros**: Simpler architecture, standard SaaS model
* **Cons**: Migration challenges, potential revenue model shift

### 2. Maintain Separate Licensing System

* **Pros**: Familiar to users, maintains current model
* **Cons**: Two systems to maintain, potential confusion

### 3. Integrate Licensing with Authentication

* **Pros**: Unified experience, simplified architecture
* **Cons**: Integration work needed, potential vendor limits

## Decision

We will transition from a license key system to a direct subscription model using
Polar.sh, fully integrated with our cloud authentication:

1. User identity and authentication managed by Clerk
2. Subscription status managed directly through Polar.sh
3. Subscription state stored in user's Convex record
4. Legacy users automatically migrated to equivalent subscription tiers

## Rationale

This approach offers several advantages:

1. Simplified user experience (no license keys to manage)
2. Modern SaaS subscription model
3. Native cloud-first architecture
4. Reduced complexity in codebase
5. Better user experience across devices

By moving to a direct subscription model, we eliminate unnecessary complexity while
maintaining the same revenue model through Polar.sh subscriptions.

## Consequences

### Positive

* Simplified user experience
* Reduced architectural complexity
* Native cloud integration
* Automatic subscription management
* Improved cross-device support

### Negative

* Migration effort for existing users
* Initial development work for subscription integration
* Need to communicate changes to users
* Temporary support needed for legacy license keys

## Implementation Plan

1. Set up Polar.sh subscription webhooks
2. Create subscription status field in Convex user records
3. Implement automatic user tier assignment based on Polar.sh status
4. Add subscription management UI in user settings
5. Migrate existing users:
   * Map license keys to subscription tiers
   * Create Clerk accounts for existing users
   * Transfer user data to Convex
   * Deprecate license key validation

## Status

In Progress - Phase 1 (Subscription Integration)
