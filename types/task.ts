export type QuadrantType = "q1" | "q2" | "q3" | "q4"
export type TaskType = "personal" | "work" | "business" | "idea" | undefined

export interface TaskReflection {
  justification: string
  aiAnalysis?: string
  suggestedQuadrant?: QuadrantType
  finalQuadrant: QuadrantType
  feedback?: string
  content?: string
  reflectedAt: string
}

export interface Task {
  id: string
  text: string
  quadrant: QuadrantType
  taskType?: TaskType
  completed: boolean
  needsReflection: boolean
  reflection?: TaskReflection
  createdAt: string
  updatedAt: string
  order?: number // Order within the quadrant, used for manual sorting
}
