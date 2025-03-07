---
last_updated: 2025-03-07
update_history:
  - 2025-03-07: Initial documentation
---

# Decision Record: Licensing Approach

## Date
2025-03-07

## Context
The application currently uses a license key system via Polar.sh to manage user access. As we transition to a user authentication system with Clerk and move toward cloud-based storage with Supabase, we need to determine how licensing will integrate with the new architecture.

## Options Considered

### 1. Replace Licensing with Subscription-Only
- **Pros**: Simpler architecture, standard SaaS model
- **Cons**: Migration challenges for existing users, potential revenue model shift

### 2. Maintain Separate Licensing System
- **Pros**: Familiar to existing users, maintains current business model
- **Cons**: Two separate systems to maintain, potential user confusion

### 3. Integrate Licensing with Authentication
- **Pros**: Unified user experience, simplified architecture
- **Cons**: Development work to integrate systems, potential vendor limitations

## Decision
We will maintain the Polar.sh licensing/subscription system but integrate it with our new authentication system. Specifically:

1. User identity will be managed by Clerk
2. Subscription/license status will be managed by Polar.sh
3. User accounts will be linked to license keys in our database
4. Legacy users will receive special handling during migration

## Rationale
This approach offers several advantages:
1. Maintains continuity for existing users
2. Preserves current business model
3. Provides path to cross-device functionality
4. Separates concerns (authentication vs. authorization)
5. Enables gradual transition without disruption

By keeping licensing separate from identity, we maintain flexibility in our business model while still enabling the technical enhancements needed for cross-device support.

## Consequences

### Positive
- Preserves existing revenue model
- Maintains familiar system for current users
- Clean separation of concerns
- Flexibility for future changes

### Negative
- Two systems to maintain
- Slightly more complex architecture
- Integration work required
- Potential user confusion between accounts and licenses

## Implementation Plan
1. Maintain current Polar.sh webhook integration
2. When adding Clerk authentication:
   - Add license key field to user profiles in database
   - Associate existing license keys with new user accounts
   - Update UI to show both authentication and license status
3. Update licensing checks to validate against both user identity and license
4. Provide migration path for legacy users

## Status
Planned (following authentication implementation)
