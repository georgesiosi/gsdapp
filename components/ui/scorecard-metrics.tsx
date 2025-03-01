"use client";

import type { ScorecardMetrics, ScorecardTrends } from "@/types/scorecard";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";

interface ScorecardMetricsProps {
  metrics: ScorecardMetrics;
  trends: ScorecardTrends;
}

export function ScorecardMetrics({ metrics, trends }: ScorecardMetricsProps) {
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

  // Helper function to format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="scorecard-metrics">
      {/* Overall Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
            <div className="flex items-center">
              {renderTrendIndicator(trends.completionRateTrend)}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-semibold text-gray-900">
              {formatPercentage(metrics.completionRate)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.completedTasks} of {metrics.totalTasks} tasks completed
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">High-Value Completion</h3>
            <div className="flex items-center">
              {renderTrendIndicator(trends.highValueCompletionTrend)}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-semibold text-gray-900">
              {formatPercentage(metrics.highValueCompletionRate)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Q1 + Q2 tasks completion rate
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Priority Alignment</h3>
            <div className="flex items-center">
              {renderTrendIndicator(trends.priorityAlignmentTrend)}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-semibold text-gray-900">
              {metrics.priorityAlignmentScore}/10
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Alignment with stated priorities
            </p>
          </div>
        </div>
      </div>

      {/* Quadrant Breakdown */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quadrant Breakdown</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 p-3 rounded-lg border border-red-100">
            <h4 className="text-xs font-medium text-red-800">Q1: Urgent & Important</h4>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm font-semibold text-gray-900">
                {formatPercentage(metrics.quadrantMetrics.q1.completionRate)}
              </p>
              <p className="text-xs text-gray-500">
                {metrics.quadrantMetrics.q1.completed}/{metrics.quadrantMetrics.q1.total}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-red-500 h-1.5 rounded-full" 
                style={{ width: `${metrics.quadrantMetrics.q1.completionRate * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
            <h4 className="text-xs font-medium text-orange-800">Q2: Not Urgent but Important</h4>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm font-semibold text-gray-900">
                {formatPercentage(metrics.quadrantMetrics.q2.completionRate)}
              </p>
              <p className="text-xs text-gray-500">
                {metrics.quadrantMetrics.q2.completed}/{metrics.quadrantMetrics.q2.total}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-orange-500 h-1.5 rounded-full" 
                style={{ width: `${metrics.quadrantMetrics.q2.completionRate * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            <h4 className="text-xs font-medium text-yellow-800">Q3: Urgent but Not Important</h4>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm font-semibold text-gray-900">
                {formatPercentage(metrics.quadrantMetrics.q3.completionRate)}
              </p>
              <p className="text-xs text-gray-500">
                {metrics.quadrantMetrics.q3.completed}/{metrics.quadrantMetrics.q3.total}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-yellow-500 h-1.5 rounded-full" 
                style={{ width: `${metrics.quadrantMetrics.q3.completionRate * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h4 className="text-xs font-medium text-gray-800">Q4: Not Urgent & Not Important</h4>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm font-semibold text-gray-900">
                {formatPercentage(metrics.quadrantMetrics.q4.completionRate)}
              </p>
              <p className="text-xs text-gray-500">
                {metrics.quadrantMetrics.q4.completed}/{metrics.quadrantMetrics.q4.total}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-gray-500 h-1.5 rounded-full" 
                style={{ width: `${metrics.quadrantMetrics.q4.completionRate * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
