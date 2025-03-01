"use client";

import { useState } from "react";
import type { Scorecard } from "@/types/scorecard";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface ScorecardHistoryListProps {
  scorecards: Scorecard[];
}

export function ScorecardHistoryList({ scorecards }: ScorecardHistoryListProps) {
  const [expandedScorecard, setExpandedScorecard] = useState<string | null>(null);

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
    }
  };

  return (
    <div className="space-y-4">
      {sortedScorecards.length === 0 ? (
        <p className="text-center text-gray-500">No scorecard history available.</p>
      ) : (
        sortedScorecards.map((scorecard) => (
          <div key={scorecard.id} className="border rounded-lg overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(scorecard.id)}
            >
              <div className="flex items-center">
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
                
                <div>
                  {expandedScorecard === scorecard.id ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
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
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
