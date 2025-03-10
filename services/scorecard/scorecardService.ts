import { useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Scorecard } from "@/types/scorecard";

export class ScorecardService {
  static getAllScorecards(): Scorecard[] {
    try {
      const scorecards = localStorage.getItem('scorecards');
      return scorecards ? JSON.parse(scorecards) : [];
    } catch (error) {
      console.error('Error retrieving scorecards:', error);
      return [];
    }
  }
}

export function useScorecard() {
  const scorecards = useQuery(api.scorecards.getScorecards) || [];
  const addScorecardMutation = useMutation(api.scorecards.addScorecard);
  const updateScorecardMutation = useMutation(api.scorecards.updateScorecard);
  const deleteScorecardMutation = useMutation(api.scorecards.deleteScorecard);

  const addScorecard = useCallback(async (scorecardData: Omit<Scorecard, "id" | "_creationTime">) => {
    try {
      const scorecardId = await addScorecardMutation({
        metrics: scorecardData.metrics,
        trends: scorecardData.trends,
        insights: scorecardData.insights,
        notes: scorecardData.notes,
      });

      // Return a temporary scorecard object while optimistic update is in progress
      return {
        success: true,
        scorecard: {
          id: scorecardId,
          _creationTime: Date.now(),
          ...scorecardData,
        } as Scorecard,
      };
    } catch (error) {
      console.error("Error adding scorecard:", error);
      return { success: false, error: "Failed to add scorecard" };
    }
  }, [addScorecardMutation]);

  const updateScorecard = useCallback(async (id: Id<"scorecards">, updates: Partial<Omit<Scorecard, "id" | "_creationTime">>) => {
    try {
      await updateScorecardMutation({
        id,
        metrics: updates.metrics,
        trends: updates.trends,
        insights: updates.insights,
        notes: updates.notes,
      });
      return { success: true };
    } catch (error) {
      console.error("Error updating scorecard:", error);
      return { success: false, error: "Failed to update scorecard" };
    }
  }, [updateScorecardMutation]);

  const deleteScorecard = useCallback(async (id: Id<"scorecards">) => {
    try {
      await deleteScorecardMutation({
        id,
      });
      return { success: true };
    } catch (error) {
      console.error("Error deleting scorecard:", error);
      return { success: false, error: "Failed to delete scorecard" };
    }
  }, [deleteScorecardMutation]);

  return {
    scorecards,
    addScorecard,
    updateScorecard,
    deleteScorecard,
  };
}
