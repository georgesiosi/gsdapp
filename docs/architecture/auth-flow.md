---
last_updated: 2025-03-07
update_history:
  - 2025-03-07: Initial documentation
---

# Authentication Flow

The authentication process consists of:

1. Step 1
2. Step 2
3. Step 3

## Current State

The application currently uses a license key validation approach:

* Users can input a license key in their profile
* License keys are validated via Polar.sh subscription status
* No user identity beyond license key
* Legacy users have access without license keys

## Planned Authentication Evolution

### Phase 1: Add User Authentication (Clerk)

#### Sign Up Flow

1. User creates account via Clerk providers (email, social)
2. Basic profile created with authentication tokens
3. Upon successful authentication, redirect to app
4. Existing localStorage data associated with new account

#### Sign In Flow

1. User authenticates with existing credentials
2. Application retrieves user profile
3. UI adapts to logged-in state
4. localStorage data loaded (no sync yet)

#### Session Management

* Clerk handles token refresh and session management
* Application maintains session state using Clerk hooks
* Protected routes require authentication

### Phase 2: User Identity + License Validation

* Authentication (who you are) separate from authorization (what you can access)
* Polar subscriptions tied to user accounts
* License keys become optional/legacy

### Phase 3: Complete Integration

* Role-based access control
* Team/organization support
* Shared workspaces (if applicable)

### Security Considerations

Key security aspects include:

* No passwords stored in application code
* Authentication tokens handled by Clerk
* API requests authenticated with proper tokens
* Webhook validation for subscription events

## UI Components

* Login/signup modals
* Profile section showing account status
* Subscription status indicators
* Account management options

