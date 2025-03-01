// Task quadrant types
export type QuadrantType = "q1" | "q2" | "q3" | "q4";

// Task types
export type TaskType = "personal" | "work";

// Combined task and idea type
export type TaskOrIdeaType = TaskType | "idea";

// Task interface
export interface Task {
  id: string;
  text: string;
  quadrant: QuadrantType;
  taskType?: TaskOrIdeaType;
  completed: boolean;
  needsReflection: boolean;
  reflection?: TaskReflection;
  createdAt: string;
  updatedAt: string;
  order?: number; // Order within the quadrant, used for manual sorting
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

// User settings interface
export interface UserSettings {
  goal?: string;
  priority?: string;
  theme?: 'light' | 'dark' | 'system';
  showCompletedTasks?: boolean;
  autoAnalyze?: boolean;
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
