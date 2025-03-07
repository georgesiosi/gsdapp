---
last_updated: 2025-03-07
update_history:
  - 2025-03-07: Initial documentation
---

# Legacy Data Migration Strategy

## Context

The GSD App is transitioning from a local-storage based system with license keys to a cloud-based authentication system using Clerk, with future data storage in Supabase. During this transition, we need to ensure that existing users' data is properly migrated and associated with their new Clerk identity.

## Decision

We've implemented a phased data migration approach:

1. **Phase 1: User Identity Linkage**
   - When a user signs in with Clerk, detect if they have existing localStorage data
   - Prompt the user to link their existing data to their new Clerk account
   - Store the user's Clerk ID in localStorage alongside their existing data
   - Preserve legacy license information for backward compatibility

2. **Implementation Details**
   - Created a `LegacyMigration` component that appears when a user signs in and has unmigrated data
   - Built a reusable `useDataMigration` hook for handling data migration anywhere in the application
   - Added extensive error handling and user feedback
   - Implemented proper state tracking of which data has been migrated

## Consequences

### Positive

- **Seamless User Experience**: Users can continue using the app without losing their data
- **Progressive Migration**: Following our phased approach from localStorage to Supabase
- **Backward Compatibility**: Legacy license keys remain functional while introducing modern auth
- **Developer Experience**: The hook-based approach makes migration logic accessible throughout the app

### Negative

- **Data Duplication**: Initially, all data exists in both localStorage and will be duplicated in Supabase
- **Temporary Complexity**: We're maintaining two parallel authentication systems during transition

## Next Steps

1. Proceed with Phase 2: Migrate user preferences to Supabase
2. Implement background synchronization between localStorage and Supabase
3. Add offline support using localStorage as a cache
