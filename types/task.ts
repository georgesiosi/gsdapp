export type QuadrantType = "q1" | "q2" | "q3" | "q4"

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
  completed: boolean
  needsReflection: boolean
  reflection?: TaskReflection
  createdAt: string
  updatedAt: string
}
