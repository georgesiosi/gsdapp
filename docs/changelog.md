---
last_updated: 2025-03-08
update_history:
  - 2025-03-08: Documented service worker refresh requirements and caching behavior
  - 2025-03-08: Improved service worker implementation and fixed UI elements
  - 2025-03-08: Added task creation suggestions feature
  - 2025-03-07: Initial documentation
---

# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

* Enhanced scorecard functionality:
  * Added notes section to scorecards for personal reflections
  * Added ability to delete individual scorecard entries
  * Added save button for explicit note saving with visual feedback
* Documentation structure for tracking architectural decisions
* Polar.sh webhook integration for subscription management
* Proper signature validation using HMAC for webhook security
* OpenAI API key management in Settings with secure handling for legacy keys
* Environment variable fallback for OpenAI API key to support existing users

### Changed

* Improved PWA support and service worker implementation:
  * Fixed service worker registration process to resolve loading issues
  * Maintained original service worker unregistration component which is critical for app initialization
  * Added documentation about hard refresh requirements (Cmd+Shift+R/Ctrl+F5) after service worker changes
  * Identified and documented service worker caching behavior causing 404 errors for JavaScript chunks
* Improved menu organization and user experience:
  * Reorganized menu items into logical sections (Features, Data, Help, Account)
  * Added clear section labels and visual separators
  * Improved menu item ordering for better accessibility
* Fixed scorecard calculation logic:
  * Now properly filters tasks by today's date (created or completed today)
  * Correctly detects task completion using task.status and completedAt
  * Improved date handling for more accurate daily metrics
* Updated environment configuration to support webhook endpoints
* Refactored Docker setup to properly load environment variables
* Moved UI dependencies from devDependencies to dependencies for production builds
* Fixed PostCSS dependencies configuration for Netlify deployment
* Removed deprecated Netlify cache plugin in favor of official Next.js plugin
* Optimized Netlify configuration with improved security headers and build settings

### Fixed

* Fixed LicenseService initialization in chat API route:
  * Added automatic initialization with PolarProvider
  * Improved error handling for uninitialized service
  * Added fallback for missing API key

### Planned

* Authentication system implementation (Clerk)
* Progressive transition from localStorage to cloud database
* Cross-device synchronization capability

## [2025-03-08]

### Features

* Added task creation suggestions with real-time validation
  * Shows three best practices for writing effective tasks
  * Provides real-time feedback as user types

* Updated Ideas Bank integration
  * Now requires 'idea:' prefix for automatic idea detection
  * Added helpful tooltip in task creation modal
  * Simplified and more predictable behavior
