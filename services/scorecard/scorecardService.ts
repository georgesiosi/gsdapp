"use client";

import { Scorecard, ScorecardMetrics, ScorecardTrends } from "@/types/scorecard";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "scorecards";
const MAX_STORED_SCORECARDS = 30; // Store up to 30 days of scorecards

export class ScorecardService {
  // Get all stored scorecards
  static getAllScorecards(): Scorecard[] {
    if (typeof window === "undefined") return [];
    
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (!storedData) return [];
      
      return JSON.parse(storedData) as Scorecard[];
    } catch (error) {
      console.error("Error retrieving scorecards:", error);
      return [];
    }
  }

  // Get the most recent scorecard
  static getLatestScorecard(): Scorecard | null {
    const scorecards = this.getAllScorecards();
    if (scorecards.length === 0) return null;
    
    // Sort by date (newest first) and return the first one
    return scorecards.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }

  // Check if a scorecard exists for today
  static getTodayScorecard(): Scorecard | null {
    const scorecards = this.getAllScorecards();
    if (scorecards.length === 0) return null;
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Find a scorecard that was created today
    const todayScorecard = scorecards.find(scorecard => {
      const scorecardDate = new Date(scorecard.createdAt).toISOString().split('T')[0];
      return scorecardDate === today;
    });
    
    return todayScorecard || null;
  }

  // Get scorecards for the last n days
  static getRecentScorecards(days: number = 7): Scorecard[] {
    const scorecards = this.getAllScorecards();
    if (scorecards.length === 0) return [];
    
    // Sort by date (newest first)
    const sortedScorecards = scorecards.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Return up to the specified number of days
    return sortedScorecards.slice(0, days);
  }

  // Save a new scorecard
  static saveScorecard(scorecard: Scorecard): boolean {
    try {
      // Get existing scorecards
      const existingScorecards = this.getAllScorecards();
      
      // Add the new scorecard
      const updatedScorecards = [scorecard, ...existingScorecards];
      
      // Limit to max number of stored scorecards
      const limitedScorecards = updatedScorecards.slice(0, MAX_STORED_SCORECARDS);
      
      // Save back to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedScorecards));
      
      return true;
    } catch (error) {
      console.error("Error saving scorecard:", error);
      return false;
    }
  }

  // Calculate trends based on recent scorecards
  static calculateTrends(currentMetrics: ScorecardMetrics): ScorecardTrends {
    const recentScorecards = this.getRecentScorecards(7);
    
    // Default to stable if not enough data
    if (recentScorecards.length < 2) {
      return {
        completionRateTrend: 'stable',
        highValueCompletionTrend: 'stable',
        priorityAlignmentTrend: 'stable'
      };
    }
    
    // Calculate averages excluding the current day
    const recentMetrics = recentScorecards.map(s => s.metrics);
    
    const avgCompletionRate = recentMetrics.reduce(
      (sum, m) => sum + m.completionRate, 0
    ) / recentMetrics.length;
    
    const avgHighValueRate = recentMetrics.reduce(
      (sum, m) => sum + m.highValueCompletionRate, 0
    ) / recentMetrics.length;
    
    const avgPriorityAlignment = recentMetrics.reduce(
      (sum, m) => sum + m.priorityAlignmentScore, 0
    ) / recentMetrics.length;
    
    // Determine trends (with a small threshold to avoid minor fluctuations)
    const completionRateTrend = determineTrend(currentMetrics.completionRate, avgCompletionRate);
    const highValueCompletionTrend = determineTrend(currentMetrics.highValueCompletionRate, avgHighValueRate);
    const priorityAlignmentTrend = determineTrend(currentMetrics.priorityAlignmentScore, avgPriorityAlignment);
    
    return {
      completionRateTrend,
      highValueCompletionTrend,
      priorityAlignmentTrend
    };
  }

  // Create a new scorecard with the given data
  static createScorecard(
    metrics: ScorecardMetrics,
    insights: { analysis: string; suggestions: string[] },
    notes?: string
  ): Scorecard {
    // Calculate trends
    const trends = this.calculateTrends(metrics);
    
    // Create the scorecard
    const scorecard: Scorecard = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      metrics,
      trends,
      insights,
      notes
    };
    
    // Save the scorecard
    this.saveScorecard(scorecard);
    
    return scorecard;
  }

  // Update notes for an existing scorecard
  static updateScorecardNotes(scorecardId: string, notes: string): boolean {
    try {
      const scorecards = this.getAllScorecards();
      const scorecardIndex = scorecards.findIndex(s => s.id === scorecardId);
      
      if (scorecardIndex === -1) return false;
      
      // Update the notes
      scorecards[scorecardIndex].notes = notes;
      
      // Save back to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scorecards));
      
      return true;
    } catch (error) {
      console.error("Error updating scorecard notes:", error);
      return false;
    }
  }
}

// Helper function to determine trend direction
function determineTrend(current: number, average: number): 'up' | 'down' | 'stable' {
  const threshold = 0.05; // 5% threshold to determine significant change
  
  if (current > average * (1 + threshold)) {
    return 'up';
  } else if (current < average * (1 - threshold)) {
    return 'down';
  } else {
    return 'stable';
  }
}
