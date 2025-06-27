# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
npm run dev           # Start development server on port 3050
npm run build         # Build for production
npm run start         # Start production server (uses $PORT env var)
npm run lint          # Run ESLint
npm run test          # Run Jest tests
npm run test:watch    # Run tests in watch mode
```

### Database Migration
```bash
npm run migrate:dates # Run date migration script
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15+ with TypeScript 5.7+
- **Database**: Convex (real-time backend-as-a-service)
- **Authentication**: Clerk
- **UI**: React 18 with Tailwind CSS and Radix UI primitives (via shadcn/ui)
- **State Management**: Zustand + React hooks
- **AI Integration**: OpenAI API for task categorization and analysis
- **Testing**: Jest with React Testing Library

### Core Architecture
The app follows a feature-based architecture with these key patterns:

1. **Data Layer**: Convex handles all data persistence with real-time updates
   - Schema defined in `convex/schema.ts` with tables for tasks, ideas, goals, scorecards, and user preferences
   - All mutations and queries go through Convex functions

2. **Authentication Flow**: Clerk provides user authentication
   - Users can be legacy (localStorage) or authenticated (Convex)
   - Data migration dialog handles transition between states

3. **AI-Powered Task Management**: 
   - Tasks are categorized using Eisenhower Matrix (Q1-Q4 quadrants)
   - OpenAI API analyzes task text to suggest optimal quadrant placement
   - Ideas vs tasks are automatically detected and routed appropriately

4. **Component Structure**:
   - Feature-based organization under `/components`
   - Custom hooks in `/components/*/hooks/` for business logic
   - UI components in `/components/ui/` following shadcn/ui patterns

### Key Features
- **Eisenhower Matrix**: Tasks organized by urgency/importance (Q1-Q4)
- **Ideas Bank**: Separate storage for ideas vs actionable tasks
- **Goal Setting**: Users can set and track main goals
- **Reflection System**: Tasks can include reflection and AI analysis
- **Scorecard System**: Daily productivity metrics and insights
- **Export Functionality**: CSV export for tasks and data

### Data Models (Convex Schema)
- **tasks**: Core task entity with quadrant, status, reflection data
- **ideas**: Separate from tasks, includes priority connection flag
- **goals**: User-defined objectives with status tracking
- **userPreferences**: Settings, theme, onboarding status, master plan
- **scorecards**: Daily productivity metrics and AI insights
- **subscriptions**: User subscription status and tiers

### File Structure Patterns
- `/app/` - Next.js app router pages and API routes
- `/components/` - React components (feature-based organization)
- `/convex/` - Database schema, mutations, and queries
- `/services/` - Business logic (AI, scorecard generation, etc.)
- `/hooks/` - Shared React hooks
- `/types/` - TypeScript type definitions
- `/lib/` - Utility functions

### Development Notes
- Port 3050 is used for development (not default 3000)
- TypeScript paths are configured with `@/` prefix for imports
- ESLint and TypeScript errors are ignored during builds for faster iteration
- PWA capabilities with service worker and manifest
- Docker setup available for containerized development

### AI Integration Patterns
- API routes in `/app/api/` handle OpenAI interactions
- Task categorization uses structured prompts for quadrant assignment
- Ideas detection separates actionable tasks from brainstorming content
- Reflection analysis provides AI feedback on task placement decisions

### Testing Strategy
- Jest configured with React Testing Library
- Tests focus on hooks and component behavior
- Setup in `jest.setup.js` with path aliases matching tsconfig

### Subscription/Licensing
- Polar.sh integration for subscription management
- Webhook handling for subscription events
- Free/Pro/Team tiers supported