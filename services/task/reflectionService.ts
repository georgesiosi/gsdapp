import { Task, TaskReflection } from '@/types/task';
import { AIProvider } from '../ai/types';
import { OpenAIProvider } from '../ai/openai';

export class ReflectionService {
  private aiProvider: AIProvider;

  constructor(aiProvider: AIProvider = new OpenAIProvider()) {
    this.aiProvider = aiProvider;
  }

  needsReflection(task: Task): boolean {
    // Tasks in q3 or q4 require reflection
    return ['q3', 'q4'].includes(task.quadrant) && !task.reflection;
  }

  async analyzeReflection(task: Task, reflection: string): Promise<TaskReflection> {
    const analysis = await this.aiProvider.analyzeReflection(task.text, reflection);
    
    return {
      content: reflection,
      feedback: analysis.feedback,
      suggestedQuadrant: analysis.suggestedQuadrant,
      reflectedAt: new Date().toISOString(),
    };
  }
}
