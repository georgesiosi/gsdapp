"use client";

import { useEffect, useState } from "react";
import { ScorecardService } from "@/services/scorecard/scorecardService"; 
import type { Scorecard } from "@/types/scorecard";
import { Card } from "@/components/ui/card"; 
import { ScorecardHistoryChart } from "@/components/scorecard-history-chart"; 
import { ScorecardHistoryList } from "@/components/scorecard-history-list"; 
import { PageIntro } from '@/components/page-intro'; 

export default function ScorecardHistoryPage() {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load scorecards from localStorage
    const loadScorecards = () => {
      try {
        const allScorecards = ScorecardService.getAllScorecards();
        setScorecards(allScorecards);
      } catch (error) {
        console.error("Error loading scorecards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScorecards();
  }, []);

  return (
    <div>
      <PageIntro showBackButton={true} />
      <h1 className="text-3xl font-bold tracking-tight mb-2">Scorecard History</h1>
      <p className="text-sm text-muted-foreground mb-6">View your past performance scores and progress over time.</p>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : scorecards.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No scorecard history found.</p>
          <p className="text-gray-500 mt-2">
            Generate your first scorecard to see it here.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Progress Over Time</h2>
            <ScorecardHistoryChart scorecards={scorecards} />
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Scorecard History</h2>
            <ScorecardHistoryList scorecards={scorecards} />
          </Card>
        </div>
      )}
    </div>
  );
}
