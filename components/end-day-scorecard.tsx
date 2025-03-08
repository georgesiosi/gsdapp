"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScorecardMetrics } from "@/components/ui/scorecard-metrics";
import type { Scorecard } from "@/types/scorecard";
import { ScorecardService } from "@/services/scorecard/scorecardService";
import type { Task } from "@/types/task";
import { useToast } from "@/components/ui/use-toast";
import { LightbulbIcon, XCircleIcon } from "lucide-react";

interface EndDayScorecardProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

export function EndDayScorecard({ isOpen, onClose, tasks }: EndDayScorecardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get user goal and priority from localStorage
  const getUserGoalAndPriority = () => {
    try {
      const goalData = localStorage.getItem("goalData");
      if (goalData) {
        const { goal, priority } = JSON.parse(goalData);
        return { goal, priority };
      }
      return { goal: "", priority: "" };
    } catch (error) {
      console.error("Error getting user goal and priority:", error);
      return { goal: "", priority: "" };
    }
  };

  // Generate scorecard
  const generateScorecard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { goal, priority } = getUserGoalAndPriority();

      // Call the API to generate the scorecard
      const response = await fetch('/api/generate-scorecard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks,
          goal,
          priority
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate scorecard: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Create and save the scorecard
      const newScorecard = ScorecardService.createScorecard(
        data.metrics,
        data.insights
      );

      setScorecard(newScorecard);
      toast({
        title: "Scorecard Generated",
        description: "Your end of day scorecard has been generated successfully.",
      });
    } catch (err) {
      console.error("Error generating scorecard:", err);
      setError("Failed to generate scorecard. Please try again.");
      toast({
        title: "Error",
        description: "Failed to generate scorecard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [tasks, toast]);

  // Generate scorecard when dialog opens
  useEffect(() => {
    if (isOpen && !scorecard && !isLoading) {
      generateScorecard();
    }
  }, [isOpen, scorecard, isLoading, generateScorecard]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setScorecard(null);
      setError(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">End of Day Scorecard</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-sm text-gray-500">Generating your scorecard...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <XCircleIcon className="h-12 w-12 text-red-500" />
            <p className="mt-4 text-sm text-gray-700">{error}</p>
            <Button 
              onClick={generateScorecard} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        ) : scorecard ? (
          <div className="scorecard-content">
            {/* Metrics Section */}
            <ScorecardMetrics 
              metrics={scorecard.metrics} 
              trends={scorecard.trends} 
            />

            {/* Insights Section */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Analysis & Insights</h3>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700">{scorecard.insights.analysis}</p>
              </div>

              <h3 className="text-sm font-medium text-gray-700 mb-3">Suggestions for Tomorrow</h3>
              <ul className="space-y-2">
                {scorecard.insights.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <LightbulbIcon className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{suggestion}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={onClose}
                className="bg-gray-900 hover:bg-gray-800"
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
