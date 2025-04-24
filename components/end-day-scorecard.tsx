"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScorecardMetrics } from "@/components/ui/scorecard-metrics";
import type { Scorecard } from "@/types/scorecard";
import { useScorecard } from "@/services/scorecard/scorecardService";
import type { Task } from "@/types/task";
import { useToast } from "@/components/ui/use-toast";
import { LightbulbIcon, XCircleIcon, AlertCircleIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EndDayScorecardProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

export function EndDayScorecard({ isOpen, onClose, tasks }: EndDayScorecardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [existingScorecard, setExistingScorecard] = useState<Scorecard | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const { toast } = useToast();
  
  // Initialize the scorecard hook
  const { scorecards, addScorecard, updateScorecard } = useScorecard();

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
      const result = await addScorecard({
        metrics: data.metrics,
        insights: data.insights,
        notes: notes, // Include any existing notes
        trends: {
          completionRateTrend: 'stable', // Or null, or fetch actual initial value
          highValueCompletionTrend: 'stable', // Or null
          priorityAlignmentTrend: 'stable' // Or null
        }
      });

      if (result.success) {
        // Ensure result.scorecard is not undefined
        setScorecard(result.scorecard ?? null);
      } else {
        throw new Error("Failed to save scorecard");
      }
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
  }, [tasks, toast, notes, addScorecard]);

  // Check for existing scorecard and handle generation when dialog opens
  useEffect(() => {
    if (isOpen && !scorecard && !isLoading && !showOverwriteConfirm) {
      // First check if a scorecard for today already exists
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
      
      const todayScorecard = scorecards.find(sc => {
        // Use creation time to find today's scorecard
        return sc._creationTime >= todayStart && sc._creationTime <= todayEnd;
      }) || null;
      
      if (todayScorecard) {
        // If a scorecard already exists for today, ask for confirmation
        // Map _id to id for the Scorecard type
        setExistingScorecard({ ...todayScorecard, id: todayScorecard._id });
        setShowOverwriteConfirm(true);
        // If there are notes in the existing scorecard, populate the notes field
        if (todayScorecard.notes) {
          setNotes(todayScorecard.notes);
        }
      } else {
        // No existing scorecard, proceed with generation
        generateScorecard();
      }
    }
  }, [isOpen, scorecard, isLoading, showOverwriteConfirm, generateScorecard, scorecards]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setScorecard(null);
      setError(null);
      setNotes("");
      setExistingScorecard(null);
      setShowOverwriteConfirm(false);
    }
  }, [isOpen]);

  // Handle notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    
    // If we have a scorecard, update its notes
    if (scorecard) {
      // Pass ID as first argument, update object as second
      updateScorecard(scorecard.id, {
        notes: e.target.value
      });
    }
  };
  
  // Handle confirmation to overwrite existing scorecard
  const handleOverwriteConfirm = () => {
    setShowOverwriteConfirm(false);
    generateScorecard();
  };
  
  // Handle decision not to overwrite
  const handleOverwriteCancel = () => {
    setShowOverwriteConfirm(false);
    setScorecard(existingScorecard);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">End of Day Scorecard</DialogTitle>
        </DialogHeader>

        {/* Overwrite Confirmation Dialog */}
        {showOverwriteConfirm && existingScorecard ? (
          <div className="py-6">
            <div className="flex items-start mb-4">
              <AlertCircleIcon className="h-6 w-6 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900">Scorecard Already Exists</h3>
                <DialogDescription className="mt-1 text-sm text-gray-500">
                  You already have a scorecard for today. Would you like to overwrite it with a new one?
                </DialogDescription>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={handleOverwriteCancel}
              >
                No, Keep Existing
              </Button>
              <Button 
                onClick={handleOverwriteConfirm}
                className="bg-gray-900 hover:bg-gray-800"
              >
                Yes, Generate New
              </Button>
            </div>
          </div>
        ) : isLoading ? (
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

            {/* Notes Section */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="mb-3">
                <Label htmlFor="scorecard-notes" className="text-sm font-medium text-gray-700">Personal Reflections</Label>
                <div className="mt-1">
                  <Textarea
                    id="scorecard-notes"
                    value={notes}
                    onChange={handleNotesChange}
                    placeholder="Add your personal reflections, thoughts, or insights about today..."
                    className="min-h-[100px] w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <DialogFooter className="mt-6">
              <Button 
                onClick={onClose}
                className="bg-gray-900 hover:bg-gray-800"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
