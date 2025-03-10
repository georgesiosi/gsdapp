---
last_updated: 2025-03-07
update_history:
  - 2025-03-07: Initial documentation
---

# Authentication Flow

The authentication and authorization flow consists of:

1. User authentication through Clerk (email, social providers)
2. User data management in Convex
3. Subscription validation through Polar.sh

## Current State

The application uses a modern cloud-based approach:

* Authentication managed by Clerk (email, social login)
* Data storage and sync through Convex
* Subscription management via Polar.sh
* User preferences stored in Convex
* Automatic data migration from localStorage

## Planned Authentication Evolution

### Phase 1: User Authentication with Clerk (Completed)

#### Sign Up Flow

1. User creates account via Clerk providers (email, social)
2. Clerk UserProfile component handles account creation and management
3. Upon successful authentication, user is redirected to the app
4. User preferences are automatically created in Convex
5. Any existing localStorage data is migrated to Convex

#### Sign In Flow

1. User authenticates with existing credentials
2. Application retrieves user profile from Clerk
3. Convex syncs user data across devices
4. UI updates with real-time data

#### Session Management

* Clerk handles authentication and session tokens
* Convex manages real-time data synchronization
* Protected routes and data access secured by both services

### Phase 2: User Identity + Subscription Management

* Authentication handled by Clerk
* Subscription status managed by Polar.sh
* User data synced through Convex
* Direct subscription model (no license keys)

### Phase 3: Advanced Features

* Role-based access control
* Team collaboration features
* Shared workspaces
* Enhanced subscription tiers

### Security Considerations

Key security aspects include:

* No sensitive data stored in application code
* Authentication handled entirely by Clerk
* All data stored securely in Convex
* Subscription webhooks validated by Polar.sh

## UI Components

* Login/signup modals
* Profile section with account details
* Current subscription tier display
* Account and subscription management
