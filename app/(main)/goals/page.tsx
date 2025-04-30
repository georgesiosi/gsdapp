"use client";

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; 
import { LoadingSpinner } from '@/components/ui/loading-spinner'; 

export default function GoalsPage() {
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();
  const userId = user?.id;

  const rawGoalsList = useQuery(
    api.goals.getGoals,
    userId ? undefined : "skip"
  );

  // Handle loading state
  if (!isLoaded || !isSignedIn) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold pb-6 border-b-0">All Goals</h1>

      {rawGoalsList === undefined && <p>Loading goals...</p>} 

      {rawGoalsList && rawGoalsList.length === 0 && <p>No goals found.</p>}

      {rawGoalsList && rawGoalsList.length > 0 && (
        <div className="space-y-4">
          {rawGoalsList.map((goal) => (
            <Card key={goal._id.toString()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {goal.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {goal.description ? (
                  <p className="text-sm text-muted-foreground">
                    {goal.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description provided.</p>
                )}
                
                {/* Status badge */}
                {goal.status && (
                  <Badge className="mt-2" variant={goal.status === 'active' ? 'default' : 'secondary'}>
                    {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
