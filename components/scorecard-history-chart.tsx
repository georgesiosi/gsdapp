"use client";

import { useEffect, useRef } from "react";
import type { Scorecard } from "@/types/scorecard";

interface ScorecardHistoryChartProps {
  scorecards: Scorecard[];
}

export function ScorecardHistoryChart({ scorecards }: ScorecardHistoryChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current || scorecards.length === 0) return;

    const renderChart = async () => {
      try {
        // Dynamically import Chart.js to avoid SSR issues
        const { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } = await import('chart.js');
        
        // Register the components
        Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

        // Sort scorecards by date (oldest first)
        const sortedScorecards = [...scorecards].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Prepare data for the chart
        const labels = sortedScorecards.map(scorecard => {
          const date = new Date(scorecard.createdAt);
          return date.toLocaleDateString();
        });

        const completionRateData = sortedScorecards.map(scorecard => 
          scorecard.metrics.completionRate * 100
        );

        const highValueCompletionData = sortedScorecards.map(scorecard => 
          scorecard.metrics.highValueCompletionRate * 100
        );

        const priorityAlignmentData = sortedScorecards.map(scorecard => 
          scorecard.metrics.priorityAlignmentScore * 10
        );

        // Create the chart
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        const existingChart = Chart.getChart(chartRef.current);
        if (existingChart) {
          existingChart.destroy();
        }

        new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Completion Rate (%)',
                data: completionRateData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3,
                fill: false
              },
              {
                label: 'High-Value Completion (%)',
                data: highValueCompletionData,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.3,
                fill: false
              },
              {
                label: 'Priority Alignment (%)',
                data: priorityAlignmentData,
                borderColor: 'rgb(249, 115, 22)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                tension: 0.3,
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: 'Percentage (%)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Date'
                }
              }
            },
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false
              },
              legend: {
                position: 'top',
              }
            }
          }
        });
      } catch (error) {
        console.error("Error rendering chart:", error);
      }
    };

    renderChart();
  }, [scorecards]);

  return (
    <div className="w-full h-80">
      <canvas ref={chartRef} />
    </div>
  );
}
