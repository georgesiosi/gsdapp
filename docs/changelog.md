---
last_updated: 2025-03-07
update_history:
  - 2025-03-07: Initial documentation
---

# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

* Documentation structure for tracking architectural decisions
* Polar.sh webhook integration for subscription management
* Proper signature validation using HMAC for webhook security
* OpenAI API key management in Settings with secure handling for legacy keys
* Environment variable fallback for OpenAI API key to support existing users

### Changed

* Updated environment configuration to support webhook endpoints
* Refactored Docker setup to properly load environment variables
* Moved UI dependencies from devDependencies to dependencies for production builds
* Fixed PostCSS dependencies configuration for Netlify deployment
* Removed deprecated Netlify cache plugin in favor of official Next.js plugin
* Optimized Netlify configuration with improved security headers and build settings

### Planned

* Authentication system implementation (Clerk)
* Progressive transition from localStorage to cloud database
* Cross-device synchronization capability

