import { Id } from "../convex/_generated/dataModel";

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
  highValueCompletionRate: number;
  priorityAlignmentScore: number;
}

export interface ScorecardTrends {
  completionRateTrend: string;
  highValueCompletionTrend: string;
  priorityAlignmentTrend: string;
}

export interface ScorecardInsights {
  analysis: string;
  suggestions: string[];
}

export interface Scorecard {
  id: Id<"scorecards">;
  metrics: ScorecardMetrics;
  trends: ScorecardTrends;
  insights: ScorecardInsights;
  notes?: string;
  _creationTime: number;
}
