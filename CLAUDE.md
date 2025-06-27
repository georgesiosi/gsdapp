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
The app follows a simplified, streamlined architecture focused on core task management:

1. **Data Layer**: Convex handles all data persistence with real-time updates
   - Schema defined in `convex/schema.ts` with tables for tasks, goals, scorecards, and user preferences
   - All mutations and queries go through Convex functions
   - Intelligent task ordering based on due dates, goal priority, and creation time

2. **Authentication Flow**: Clerk provides user authentication
   - Users can be legacy (localStorage) or authenticated (Convex)
   - Data migration dialog handles transition between states

3. **AI-Powered Task Management**: 
   - Tasks are categorized using Eisenhower Matrix (Q1-Q4 quadrants)
   - OpenAI API analyzes task text to suggest optimal quadrant placement via `/api/categorize`
   - AI reasoning stored in `aiReasoning` field for tooltip display
   - Automatic task type detection (personal/business) based on keywords

4. **Component Structure**:
   - Simplified organization under `/components`
   - Custom hooks in `/components/task/hooks/` for task management logic
   - UI components in `/components/ui/` following shadcn/ui patterns

### Key Features
- **Eisenhower Matrix**: Tasks organized by urgency/importance (Q1-Q4)
- **AI Auto-Sorting**: Automatic task categorization with reasoning explanations
- **Goal Setting**: Users can set and track main goals with task linking
- **Task Type Detection**: Automatic personal/business classification
- **Scorecard System**: Daily productivity metrics and insights
- **Export Functionality**: CSV export for tasks and data

### Data Models (Convex Schema)
- **tasks**: Core task entity with quadrant, status, aiReasoning field, and goal linking
- **goals**: User-defined objectives with status tracking and ordering
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
- `/api/categorize` endpoint provides task quadrant suggestions
- Task categorization uses structured prompts for quadrant assignment
- AI reasoning stored directly in task records for tooltip display
- Automatic task type detection using keyword-based classification

### Testing Strategy
- Jest configured with React Testing Library
- Tests focus on hooks and component behavior
- Setup in `jest.setup.js` with path aliases matching tsconfig

### Recent Simplification (Power Through Simplicity)
The codebase underwent major simplification to focus on core functionality:

**Removed Systems (~4,000 lines removed):**
- Complex reflection system with nested task analysis
- Separate ideas bank (consolidated into tasks)
- Custom event systems for complex AI workflows
- Multiple task interface adapters (ConvexTask, NewTask)
- Complex reasoning log services

**Simplified Architecture:**
- Unified Task interface works for both Convex and client usage
- Direct AI reasoning storage in `aiReasoning` field
- Streamlined AI auto-sorting with specific task targeting
- Keyword-based task type detection
- Simplified tooltip system reading directly from task data

**Key Improvements:**
- "AI is thinking..." indicator targets specific tasks being processed
- P/B labels automatically assigned based on content analysis
- AI reasoning tooltips work directly from task data
- Cleaner database schema without legacy reflection fields
- Faster development with less complex abstractions

### Task Management Workflow
1. **Task Creation**: User adds task text
2. **AI Analysis**: `/api/categorize` suggests quadrant placement
3. **Auto-Classification**: Keywords determine personal vs business type
4. **Reasoning Storage**: AI explanation saved in `aiReasoning` field
5. **Smart Ordering**: Tasks ordered by due date > goal priority > creation time

### Subscription/Licensing
- Polar.sh integration for subscription management
- Webhook handling for subscription events
- Free/Pro/Team tiers supported