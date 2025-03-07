---
last_updated: 2025-03-07
update_history:
  - 2025-03-07: Initial documentation
---

# Data Model

## Current Data Entities

### User Profile

* User preferences and settings
* Theme selection
* OpenAI API key (if provided)
* License information

### Tasks

* Task text content
* Creation timestamp
* Completion status
* Priority association
* Metadata (tags, context)

### Priorities

* Priority name/text
* Creation timestamp
* Associated tasks
* Status (active/archived)

### Ideas

* Idea text content
* Creation timestamp
* Type categorization
* Priority connection (if applicable)
* Source (AI-detected, user-created)

## Storage Locations

### LocalStorage (Current Implementation)

* All user data is stored in browser localStorage
* Data is persisted across sessions but limited to the current device
* Organized in separate keys for different data types

## Planned Evolution

### Phase 1: Add User Identity

* User authentication data (via Clerk)
* User profile information will include account details
* LocalStorage will continue to store application data

### Phase 2: Initial Database Integration

* User profiles and preferences in database
* Other data remains in localStorage initially
* Database schema will mirror current data structure

### Phase 3: Complete Cloud Migration

* All data entities migrated to database
* LocalStorage used as cache/offline capability
* Schema additions for conflict resolution and sync tracking

## Data Relationships

```
User
├── Priorities
│   └── Tasks
├── Standalone Tasks
└── Ideas
    └── Priority Connections (optional)
```

## Migration Strategy

1. Add user identification to existing data structures
2. Create database tables mirroring current localStorage structure
3. Implement initial sync for user preferences
4. Gradually migrate other data entities
5. Develop conflict resolution for concurrent edits


## Security Considerations

* No sensitive data stored in localStorage (API keys handled securely)
* Authentication tokens managed by auth provider
* Future database access controlled via row-level security
* Data encryption for sensitive information

