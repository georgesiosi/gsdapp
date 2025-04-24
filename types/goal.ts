import { Id } from "../convex/_generated/dataModel";

/**
 * Represents the possible states of a goal.
 * - 'active': Goal is currently being pursued.
 * - 'achieved': Goal has been successfully completed.
 * - 'archived': Goal is no longer relevant or pursued, but kept for records.
 */
export type GoalStatus = 'active' | 'achieved' | 'archived';

/**
 * Represents a user-defined goal.
 * Goals provide high-level direction and context for tasks.
 */
export interface Goal {
  /** Unique identifier for the goal (from Convex) */
  _id: Id<"goals">;
  /** Creation timestamp (milliseconds since epoch) */
  _creationTime: number;
  /** ID of the user who owns this goal */
  userId: string;
  /** The main title or objective of the goal */
  title: string;
  /** Optional detailed description of the goal */
  description?: string;
  /** Current status of the goal */
  status: GoalStatus;
  /** ISO string timestamp of when the goal was last updated */
  updatedAt?: string; // Added for potential future updates
}

/**
 * Represents a goal object suitable for frontend use, mapping _id to id.
 */
export interface FrontendGoal extends Omit<Goal, '_id'> {
  id: string;
}
