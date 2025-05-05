import { Id } from "@/convex/_generated/dataModel";

// Task quadrant types
export type QuadrantKeys = 'q1' | 'q2' | 'q3' | 'q4';

// Task types
export type TaskType = "personal" | "work" | "business";

// Idea type
export type IdeaType = "idea";

// Combined task and idea type
export type TaskOrIdeaType = TaskType | IdeaType;

/**
 * Represents the possible states of a task.
 * - 'active': Task is currently in progress or pending
 * - 'completed': Task has been finished
 */
export type TaskStatus = 'active' | 'completed';

/**
 * Core Task interface representing a single task in the system.
 * Tasks are the primary unit of work in the GSD (Getting Stuff Done) app.
 */
export interface Task {
  /** Unique identifier for the task */
  id: Id<"tasks">;
  /** Task title or short description */
  text: string;
  /** Detailed description of the task */
  description?: string;
  /** Eisenhower quadrant classification */
  quadrant: QuadrantKeys;
  /** Optional categorization of the task */
  taskType?: TaskOrIdeaType;
  /** Current status of the task */
  status: TaskStatus;
  /** Whether the task needs quadrant placement reflection */
  needsReflection: boolean;
  /** Optional reflection data if task has been reflected upon */
  reflection?: TaskReflection;
  /** ISO timestamp of task completion, only set when status is 'completed' */
  completedAt?: string;
  /** Optional ordering within the quadrant for manual sorting */
  order?: number;
  /** User ID who owns this task */
  userId: string;
  /** Creation timestamp */
  _creationTime: number;
  /** Optional identifier linking the task to a specific goal */
  goalId?: Id<"goals">; // Mapped from Convex _id
  /** ISO string of when the task was created */
  createdAt: string;
  /** ISO string of when the task was last updated */
  updatedAt: string;
  /** Optional due date as ISO string */
  dueDate?: string;
}

/**
 * Convex database task type
 */
export interface ConvexTask {
  _id: Id<"tasks">;
  _creationTime: number;
  text: string;
  description?: string;
  quadrant: QuadrantKeys;
  taskType?: TaskType;
  status: TaskStatus;
  needsReflection: boolean;
  reflection?: TaskReflection;
  completedAt?: string;
  order?: number;
  userId: string;
  goalId?: Id<"goals">; // Optional reference to the goals table
  createdAt: string;
  updatedAt: string;
}

// Idea interface
export interface Idea {
  id: Id<"ideas">;
  text: string;
  taskType: TaskOrIdeaType;
  connectedToPriority: boolean;
  userId: string;
  _creationTime: number;
}

// Task Reflection interface
export interface TaskReflection {
  justification: string;
  aiAnalysis?: string;
  suggestedQuadrant?: QuadrantKeys;
  finalQuadrant: QuadrantKeys;
  feedback?: string;
  content?: string;
  reflectedAt: string;
}

// Reasoning log interface
export interface ReasoningLog {
  taskId: Id<"tasks">;
  taskText: string;
  timestamp: number;
  suggestedQuadrant: QuadrantKeys;
  taskType: TaskOrIdeaType;
  reasoning: string;
  alignmentScore?: number;
  urgencyScore?: number;
  importanceScore?: number;
}

// Task Manager Context interface
export interface TaskManagerContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | '_creationTime'>) => Task | null;
  updateTask: (id: Id<"tasks">, updates: Partial<Omit<Task, 'id' | '_creationTime'>>) => boolean;
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
  taskType?: TaskOrIdeaType;
  connectedToPriority?: boolean;
  reasoning?: string;
  alignmentScore?: number;
  urgencyScore?: number;
  importanceScore?: number;
  error?: string;
}
