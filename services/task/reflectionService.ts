import { Task, TaskReflection, QuadrantType } from '@/types/task';
import { AIProvider, AIAnalysisResponse } from '../ai/types';
import { OpenAIProvider } from '../ai/openai';

// Mock OpenAIProvider for testing purposes
class MockOpenAIProvider implements AIProvider {
  async analyzeReflection(taskDescription: string, reflection: string): Promise<AIAnalysisResponse> {
    return {
      isAligned: true,
      feedback: "This is mock feedback",
      suggestedQuadrant: "q1" as QuadrantType
    };
  }
}

export class ReflectionService {
  private aiProvider: AIProvider;

  constructor(aiProvider: AIProvider = new MockOpenAIProvider()) {
    this.aiProvider = aiProvider;
  }

  needsReflection(task: Task): boolean {
    // Tasks in q3 or q4 require reflection
    return ['q3', 'q4'].includes(task.quadrant) && !task.reflection;
  }

  async analyzeReflection(task: Task, reflection: string): Promise<TaskReflection> {
    const analysis = await this.aiProvider.analyzeReflection(task.text, reflection);
    
    return {
      justification: reflection, // Use the reflection as justification
      content: reflection,
      feedback: analysis.feedback,
      suggestedQuadrant: analysis.suggestedQuadrant,
      finalQuadrant: analysis.suggestedQuadrant || task.quadrant, // Default to current quadrant if no suggestion
      reflectedAt: new Date().toISOString(),
    };
  }
}
