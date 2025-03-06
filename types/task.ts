// Task quadrant types
export type QuadrantType = "q1" | "q2" | "q3" | "q4";

// Task types
export type TaskType = "personal" | "work" | "business";

// Combined task and idea type
export type TaskOrIdeaType = TaskType | "idea";

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
  id: string;
  /** Task description or content */
  text: string;
  /** Eisenhower quadrant classification */
  quadrant: QuadrantType;
  /** Optional categorization of the task */
  taskType?: TaskOrIdeaType;
  /** Current status of the task */
  status: TaskStatus;
  /** Whether the task needs quadrant placement reflection */
  needsReflection: boolean;
  /** Optional reflection data if task has been reflected upon */
  reflection?: TaskReflection;
  /** ISO timestamp of task creation */
  createdAt: string;
  /** ISO timestamp of last task update */
  updatedAt: string;
  /** ISO timestamp of task completion, only set when status is 'completed' */
  completedAt?: string;
  /** Optional ordering within the quadrant for manual sorting */
  order?: number;
}

// Idea interface
export interface Idea {
  id: string;
  text: string;
  taskType: TaskType;
  connectedToPriority: boolean;
  createdAt: string;
  updatedAt: string;
}

// Task Reflection interface
export interface TaskReflection {
  justification: string;
  aiAnalysis?: string;
  suggestedQuadrant?: QuadrantType;
  finalQuadrant: QuadrantType;
  feedback?: string;
  content?: string;
  reflectedAt: string;
}

// Reasoning log interface
export interface ReasoningLog {
  taskId: string;
  taskText: string;
  timestamp: number;
  suggestedQuadrant: QuadrantType;
  taskType: TaskType;
  reasoning: string;
  alignmentScore?: number;
  urgencyScore?: number;
  importanceScore?: number;
}

// Task Manager Context interface
export interface TaskManagerContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => Task | null;
  updateTask: (id: string, updates: Partial<Task>) => boolean;
  deleteTask: (id: string) => boolean;
  moveTask: (id: string, quadrant: QuadrantType) => boolean;
  completeTask: (id: string) => boolean;
  addTaskWithAIAnalysis: (text: string, initialQuadrant?: QuadrantType, userGoal?: string, userPriority?: string) => Promise<{ task: Task | null, isAnalyzing: boolean }>;
}

// Task settings interface
export interface TaskSettings {
  endOfDayTime: string; // 24-hour format HH:mm
  autoArchiveDelay: number; // days after completion
  gracePeriod: number; // days before permanent deletion
  retainRecurringTasks: boolean;
}

// User settings interface
export interface UserSettings {
  goal?: string;
  priority?: string;
  theme?: 'light' | 'dark' | 'system';
  showCompletedTasks?: boolean;
  autoAnalyze?: boolean;
  taskSettings: TaskSettings;
}

// AI Analysis Result interface
export interface AIAnalysisResult {
  isIdea: boolean;
  suggestedQuadrant?: QuadrantType;
  taskType?: TaskType;
  connectedToPriority?: boolean;
  reasoning?: string;
  alignmentScore?: number;
  urgencyScore?: number;
  importanceScore?: number;
  error?: string;
}
