---
last_updated: 2025-03-07
update_history:
  - 2025-03-07: Initial documentation
---

# Development Conventions

## Code Style

### General Principles
- Favor readability over cleverness
- Simple is better than complex
- Every line of code is a liability
- Focus on solving the immediate problem at hand

### JavaScript/TypeScript
- Use TypeScript for all new code
- Strict typing wherever possible
- Functional programming approach preferred
- Avoid class inheritance in favor of composition

### Components
- React components should not exceed 300 lines
- Break features into reusable pieces
- Follow atomic design principles where applicable
- Extract logic to custom hooks

### CSS/Styling
- Use TailwindCSS utility classes
- Extract common patterns to component classes
- Follow mobile-first responsive design
- Maintain consistent color scheme and spacing

## File Organization

### Directory Structure
- Feature-based organization
- Group related components, hooks, and utilities
- Keep path depths reasonable (max 3-4 levels)

### Naming Conventions
- Components: PascalCase (TaskItem.tsx)
- Hooks: camelCase with use prefix (useTaskManagement.ts)
- Utilities: camelCase (formatDate.ts)
- Constants: UPPER_SNAKE_CASE

## State Management

### Principles
- Keep state as local as possible
- Use React's built-in state management
- Custom hooks for shared state
- Avoid global state unless necessary

### Data Flow
- Unidirectional data flow
- Props for parent-to-child communication
- Callbacks for child-to-parent communication
- Context only when needed for deeply nested components

## Performance Considerations

### Optimizations
- Memoize expensive calculations
- Use virtualization for long lists
- Lazy load components when appropriate
- Debounce frequent events (resize, scroll, input)

### Resource Usage
- Minimize bundle size
- Optimize images and assets
- Monitor memory usage
- Keep API requests efficient

## Testing

### Approach
- Focus on user-facing functionality
- Unit tests for utility functions
- Component tests for interactive elements
- End-to-end tests for critical user flows

### Coverage Targets
- Critical business logic: 90%+
- UI components: 70%+
- Utilities: 80%+

## Documentation

### Code Documentation
- Self-documenting code preferred
- JSDoc for public APIs and complex functions
- README files for key directories
- Comment "why", not "what"

### Architectural Documentation
- Keep architecture documents updated
- Document significant decisions
- Maintain changelog
