export interface AIAnalysisResponse {
  isAligned: boolean;
  feedback: string;
  suggestedQuadrant?: 'q1' | 'q2' | 'q3' | 'q4';
}

export interface AIProvider {
  analyzeReflection(taskDescription: string, reflection: string): Promise<AIAnalysisResponse>;
}
