// Scorecard types
export interface ScorecardMetrics {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  quadrantMetrics: {
    q1: {
      total: number;
      completed: number;
      completionRate: number;
    };
    q2: {
      total: number;
      completed: number;
      completionRate: number;
    };
    q3: {
      total: number;
      completed: number;
      completionRate: number;
    };
    q4: {
      total: number;
      completed: number;
      completionRate: number;
    };
  };
  highValueCompletionRate: number; // Q1 + Q2 completion rate
  priorityAlignmentScore: number; // 0-10 score
}

export interface ScorecardTrends {
  completionRateTrend: 'up' | 'down' | 'stable';
  highValueCompletionTrend: 'up' | 'down' | 'stable';
  priorityAlignmentTrend: 'up' | 'down' | 'stable';
}

export interface ScorecardInsights {
  analysis: string;
  suggestions: string[];
}

export interface Scorecard {
  id: string;
  createdAt: string;
  metrics: ScorecardMetrics;
  trends: ScorecardTrends;
  insights: ScorecardInsights;
  notes?: string; // Optional user notes/reflections on the scorecard
}
