import { useProfile } from '@/hooks/use-profile'

export interface QuadrantContext {
  summary: string;
  bulletPoints: string[];
  lastUpdated: number;
}

export interface PersonalContextAnalysis {
  q1: QuadrantContext;
  q2: QuadrantContext;
  q3: QuadrantContext;
  q4: QuadrantContext;
}

export class PersonalContextService {
  private static readonly STORAGE_KEY = 'personal_context_analysis';

  static async analyzePersonalContext(personalContext: string): Promise<PersonalContextAnalysis> {
    try {
      const response = await fetch('/api/analyze-personal-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalContext
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze personal context: ${response.status}`);
      }

      const analysis = await response.json();
      
      // Store the analysis with timestamp
      const analysisWithTimestamp = {
        ...analysis,
        q1: { ...analysis.q1, lastUpdated: Date.now() },
        q2: { ...analysis.q2, lastUpdated: Date.now() },
        q3: { ...analysis.q3, lastUpdated: Date.now() },
        q4: { ...analysis.q4, lastUpdated: Date.now() },
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(analysisWithTimestamp));
      return analysisWithTimestamp;
    } catch (error) {
      console.error('Error analyzing personal context:', error);
      throw error;
    }
  }

  static getStoredAnalysis(): PersonalContextAnalysis | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error retrieving stored analysis:', error);
      return null;
    }
  }

  static clearStoredAnalysis(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
