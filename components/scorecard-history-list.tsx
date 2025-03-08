"use client";

import { useState } from "react";
import type { Scorecard } from "@/types/scorecard";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon, SaveIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScorecardService } from "@/services/scorecard/scorecardService";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ScorecardHistoryListProps {
  scorecards: Scorecard[];
}

export function ScorecardHistoryList({ scorecards: initialScorecards }: ScorecardHistoryListProps) {
  const [expandedScorecard, setExpandedScorecard] = useState<string | null>(null);
  const [scorecards, setScorecards] = useState<Scorecard[]>(initialScorecards);
  const [editingNotes, setEditingNotes] = useState<{[key: string]: string}>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();

  // Sort scorecards by date (newest first)
  const sortedScorecards = [...scorecards].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Helper function to render trend indicator
  const renderTrendIndicator = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') {
      return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    } else if (trend === 'down') {
      return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    } else {
      return <MinusIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  // Toggle expanded state for a scorecard
  const toggleExpand = (id: string) => {
    if (expandedScorecard === id) {
      setExpandedScorecard(null);
    } else {
      setExpandedScorecard(id);
      
      // Initialize notes editing for this scorecard if not already set
      const scorecard = scorecards.find(s => s.id === id);
      if (scorecard && !editingNotes[id] && scorecard.notes) {
        setEditingNotes(prev => ({
          ...prev,
          [id]: scorecard.notes || ""
        }));
      } else if (scorecard && !editingNotes[id]) {
        setEditingNotes(prev => ({
          ...prev,
          [id]: ""
        }));
      }
    }
  };
  
  // Handle notes changes
  const handleNotesChange = (id: string, notes: string) => {
    setEditingNotes(prev => ({
      ...prev,
      [id]: notes
    }));
  };
  
  // Save notes for a scorecard
  const saveNotes = (id: string) => {
    const notes = editingNotes[id];
    
    // Update in local state
    const updatedScorecards = scorecards.map(s => {
      if (s.id === id) {
        return { ...s, notes };
      }
      return s;
    });
    
    // Save to localStorage
    const success = ScorecardService.updateScorecardNotes(id, notes);
    
    if (success) {
      setScorecards(updatedScorecards);
      toast({
        title: "Notes Saved",
        description: "Your reflections have been saved successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle deletion of a scorecard
  const handleDelete = (id: string) => {
    // Open delete confirmation dialog
    setDeleteConfirmId(id);
  };
  
  // Confirm deletion of a scorecard
  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    
    // Get all scorecards from localStorage
    const allScorecards = ScorecardService.getAllScorecards();
    
    // Filter out the scorecard to delete
    const filteredScorecards = allScorecards.filter(s => s.id !== deleteConfirmId);
    
    // Save back to localStorage
    try {
      localStorage.setItem("scorecards", JSON.stringify(filteredScorecards));
      
      // Update local state
      setScorecards(prev => prev.filter(s => s.id !== deleteConfirmId));
      
      toast({
        title: "Scorecard Deleted",
        description: "The scorecard has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting scorecard:", error);
      toast({
        title: "Error",
        description: "Failed to delete scorecard. Please try again.",
        variant: "destructive",
      });
    }
    
    // Close the confirm dialog
    setDeleteConfirmId(null);
  };
  
  // Cancel deletion
  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-4">
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => deleteConfirmId && cancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scorecard</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">Are you sure you want to delete this scorecard? This action cannot be undone.</p>
          <DialogFooter className="flex space-x-2 mt-4">
            <Button onClick={cancelDelete} variant="outline">Cancel</Button>
            <Button onClick={confirmDelete} variant="destructive">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {sortedScorecards.length === 0 ? (
        <p className="text-center text-gray-500">No scorecard history available.</p>
      ) : (
        sortedScorecards.map((scorecard) => (
          <div key={scorecard.id} className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div 
                className="flex items-center flex-grow cursor-pointer"
                onClick={() => toggleExpand(scorecard.id)}
              >
                <div className="font-medium">{formatDate(scorecard.createdAt)}</div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex flex-col items-end">
                  <div className="text-sm text-gray-500">Completion</div>
                  <div className="flex items-center">
                    {formatPercentage(scorecard.metrics.completionRate)}
                    <span className="ml-1">{renderTrendIndicator(scorecard.trends.completionRateTrend)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="text-sm text-gray-500">High-Value</div>
                  <div className="flex items-center">
                    {formatPercentage(scorecard.metrics.highValueCompletionRate)}
                    <span className="ml-1">{renderTrendIndicator(scorecard.trends.highValueCompletionTrend)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="text-sm text-gray-500">Priority</div>
                  <div className="flex items-center">
                    {scorecard.metrics.priorityAlignmentScore}/10
                    <span className="ml-1">{renderTrendIndicator(scorecard.trends.priorityAlignmentTrend)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(scorecard.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Delete scorecard"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  {expandedScorecard === scorecard.id ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleExpand(scorecard.id); }} />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleExpand(scorecard.id); }} />
                  )}
                </div>
              </div>
            </div>
            
            {expandedScorecard === scorecard.id && (
              <div className="p-4 bg-gray-50 border-t">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Quadrant Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-red-700">Q1: Urgent & Important</span>
                        <span className="text-sm">{formatPercentage(scorecard.metrics.quadrantMetrics.q1.completionRate)} ({scorecard.metrics.quadrantMetrics.q1.completed}/{scorecard.metrics.quadrantMetrics.q1.total})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-orange-700">Q2: Not Urgent but Important</span>
                        <span className="text-sm">{formatPercentage(scorecard.metrics.quadrantMetrics.q2.completionRate)} ({scorecard.metrics.quadrantMetrics.q2.completed}/{scorecard.metrics.quadrantMetrics.q2.total})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-yellow-700">Q3: Urgent but Not Important</span>
                        <span className="text-sm">{formatPercentage(scorecard.metrics.quadrantMetrics.q3.completionRate)} ({scorecard.metrics.quadrantMetrics.q3.completed}/{scorecard.metrics.quadrantMetrics.q3.total})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-700">Q4: Not Urgent & Not Important</span>
                        <span className="text-sm">{formatPercentage(scorecard.metrics.quadrantMetrics.q4.completionRate)} ({scorecard.metrics.quadrantMetrics.q4.completed}/{scorecard.metrics.quadrantMetrics.q4.total})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Analysis</h3>
                    <p className="text-sm text-gray-600">{scorecard.insights.analysis}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {scorecard.insights.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600">{suggestion}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Your Notes</h3>
                    <Button
                      onClick={() => saveNotes(scorecard.id)}
                      size="sm"
                      className="h-8 px-2 flex items-center gap-1"
                      variant="outline"
                    >
                      <SaveIcon className="h-3.5 w-3.5" />
                      Save Notes
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Add your personal reflections here..."
                    className="w-full min-h-[80px]"
                    value={editingNotes[scorecard.id] || ""}
                    onChange={(e) => handleNotesChange(scorecard.id, e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
