"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel'; 
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function GoalsPage() {
  const allGoals = useQuery(api.goals.getAllGoals);

  // Helper to format status
  const formatStatus = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'active': return <Badge variant="default">Active</Badge>;
      case 'achieved': return <Badge variant="secondary" className="bg-green-100 text-green-800">Achieved</Badge>;
      case 'archived': return <Badge variant="outline">Archived</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold mb-6">All Goals</h1>

      {allGoals === undefined && <p>Loading goals...</p>} 

      {allGoals && allGoals.length === 0 && <p>No goals found.</p>}

      {allGoals && allGoals.length > 0 && (
        <div className="space-y-4">
          {allGoals.map((goal) => (
            <Card key={(goal._id as Id<"goals">).toString()}> 
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {goal.title}
                </CardTitle>
                {formatStatus(goal.status)}
              </CardHeader>
              <CardContent>
                {goal.description ? (
                  <p className="text-sm text-muted-foreground">
                    {goal.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description provided.</p>
                )}
                {/* Add other details or actions here if needed */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
