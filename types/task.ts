import { Id } from "@/convex/_generated/dataModel";

// Task quadrant types
export type QuadrantKeys = 'q1' | 'q2' | 'q3' | 'q4';

// Task types
export type TaskType = "personal" | "work" | "business";


/**
 * Represents the possible states of a task.
 * - 'active': Task is currently in progress or pending
 * - 'completed': Task has been finished
 */
export type TaskStatus = 'active' | 'completed';

/**
 * Unified Task interface - works for both Convex and client usage
 * Tasks are the primary unit of work in the GSD app.
 */
export interface Task {
  /** Unique identifier - either Convex _id or generated id */
  _id?: Id<"tasks">;
  id?: Id<"tasks">;
  /** Task title or short description */
  text: string;
  /** Detailed description of the task */
  description?: string;
  /** Eisenhower quadrant classification */
  quadrant: QuadrantKeys;
  /** Optional categorization of the task */
  taskType?: TaskType;
  /** Current status of the task */
  status: TaskStatus;
  /** ISO timestamp of task completion, only set when status is 'completed' */
  completedAt?: string;
  /** Optional ordering within the quadrant for manual sorting */
  order?: number;
  /** User ID who owns this task */
  userId: string;
  /** Creation timestamp */
  _creationTime?: number;
  /** Optional identifier linking the task to a specific goal */
  goalId?: Id<"goals">;
  /** ISO string of when the task was created */
  createdAt?: string;
  /** ISO string of when the task was last updated */
  updatedAt?: string;
  /** Optional due date as ISO string */
  dueDate?: string;
}


// Type for creating new tasks - just the required fields
export type NewTask = Pick<Task, 'text' | 'quadrant'> & Partial<Omit<Task, 'text' | 'quadrant'>>;



// Reasoning log interface
export interface ReasoningLog {
  taskId: Id<"tasks">;
  taskText: string;
  timestamp: number;
  suggestedQuadrant: QuadrantKeys;
  taskType: TaskType;
  reasoning: string;
  alignmentScore?: number;
  urgencyScore?: number;
  importanceScore?: number;
}

// Task Manager Context interface
export interface TaskManagerContextType {
  tasks: Task[];
  addTask: (task: NewTask) => Task | null;
  updateTask: (id: Id<"tasks">, updates: Partial<Task>) => boolean;
  deleteTask: (id: Id<"tasks">) => boolean;
  moveTask: (id: Id<"tasks">, quadrant: QuadrantKeys) => boolean;
  completeTask: (id: Id<"tasks">) => boolean;
  addTaskWithAIAnalysis: (text: string, initialQuadrant?: QuadrantKeys, userGoal?: string, userPriority?: string) => Promise<{ task: Task | null, isAnalyzing: boolean }>;
}

// Task settings interface
export interface TaskSettings {
  autoPrioritize: boolean;
  endOfDayTime: string; // 24-hour format HH:mm
  autoArchiveDelay: number; // days after completion
  gracePeriod: number; // days before permanent deletion
  retainRecurringTasks: boolean;
}

// User settings interface
export interface UserSettings {
  goal?: string;
  openAIKey?: string;
  priority?: string;
  theme?: 'light' | 'dark' | 'system';
  showCompletedTasks?: boolean;
  autoAnalyze?: boolean;
  syncApiKey?: boolean;
  isLegacyUser?: boolean; // Flag for users who existed before subscription system
  autoSave: boolean;
  defaultDueDate: string; // e.g., 'today', 'tomorrow', '+1d', 'none'
  taskSortOrder: 'dueDate' | 'priority' | 'creationDate';
  taskSettings: TaskSettings;
  showMasterPlan: boolean;
}

// Convex user preferences type
export interface ConvexUserPreferences extends Omit<UserSettings, 'theme'> {
  _id: Id<"userPreferences">;
  _creationTime: number;
  userId: string;
  theme?: string;  // Convex stores this as string
}

// AI Analysis Result interface
export interface AIAnalysisResult {
  isIdea: boolean;
  suggestedQuadrant?: QuadrantKeys;
  taskType?: TaskType;
  connectedToPriority?: boolean;
  reasoning?: string;
  alignmentScore?: number;
  urgencyScore?: number;
  importanceScore?: number;
  error?: string;
}
