---
last_updated: 2025-03-07
update_history:
  - 2025-03-07: Fixed scorecard calculation to properly handle daily tasks and completion status
  - 2025-03-07: Added documentation for notes and deletion features
  - 2025-03-07: Initial documentation
---

# Scorecard Feature

The scorecard feature helps users track and analyze their daily task completion and
prioritization patterns.

## Core Functionality

### Daily Scorecard Generation

- Users can generate one scorecard per day
- Prevents accidental overwriting with confirmation dialog
- Calculates metrics based on daily task activity:
  - Includes tasks created today
  - Includes tasks completed today
  - Properly tracks completion status using task.status and completedAt
- Provides accurate daily metrics for task completion and priority alignment

### Metrics Tracked

- Overall completion rate
- High-value task completion rate
- Priority alignment score (0-10)
- Quadrant-based metrics (Eisenhower Matrix)
  - Q1: Urgent & Important
  - Q2: Not Urgent but Important
  - Q3: Urgent but Not Important
  - Q4: Not Urgent & Not Important

### Trend Analysis

- Visual indicators for metric trends (up/down/stable)
- Per-quadrant completion rate tracking
- Insights and suggestions based on patterns

## Personal Notes & Reflection

Users can add personal notes to each scorecard to:

- Record their thoughts about the day
- Document what worked well or needs improvement
- Save reflections for future reference
- Track patterns in their work habits

Notes are:

- Saved locally with the scorecard
- Editable at any time
- Preserved when viewing historical scorecards

## History Management

### Viewing History

- Chronological display (newest first)
- Expandable entries with detailed metrics
- Full quadrant breakdown for each day
- Access to historical notes and insights

### Entry Management

- Delete individual scorecard entries
- Confirmation dialog to prevent accidental deletion
- Local storage cleanup on deletion

## Data Storage

All scorecard data is stored locally using:

- localStorage for scorecard entries
- Automatic saving of metrics
- Manual saving of notes with visual feedback
- Data persistence across sessions
