import OpenAI from 'openai';
import { AIAnalysisResponse, AIProvider } from './types';

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private static instance: OpenAIProvider;

  private constructor() {
    // Move API key validation to the analyze method since this runs on client side
    this.client = new OpenAI({
      apiKey: 'placeholder', // Will be replaced in the analyze method
      dangerouslyAllowBrowser: true,
    });
  }

  public static getInstance(): OpenAIProvider {
    if (!OpenAIProvider.instance) {
      OpenAIProvider.instance = new OpenAIProvider();
    }
    return OpenAIProvider.instance;
  }

  async analyzeReflection(taskDescription: string, reflection: string): Promise<AIAnalysisResponse> {
    try {
      // Make a request to our API route instead of calling OpenAI directly
      const response = await fetch('/api/analyze-reflection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: taskDescription,
          justification: reflection,
          goal: localStorage.getItem('userGoal') || '',
          priority: localStorage.getItem('userPriority') || '',
          currentQuadrant: 'q4' // Default to q4 since this is for tasks needing reflection
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze reflection');
      }

      const result = await response.json();
      return {
        isAligned: result.isAligned ?? false,
        feedback: result.feedback ?? "Unable to analyze reflection. Please try again.",
        suggestedQuadrant: result.suggestedQuadrant,
      };
    } catch (error) {
      console.error('Error in reflection analysis:', error);
      return {
        isAligned: false,
        feedback: "Unable to analyze reflection. Please try again.",
      };
    }
  }
}
