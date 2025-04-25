"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel'; 
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task, QuadrantKeys, TaskOrIdeaType, TaskStatus, TaskReflection } from '@/types/task';
import { useMemo } from 'react';

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

  const rawTaskList = useQuery(api.tasks.getTasks);
  const taskList: Task[] = useMemo(() => {
    return (rawTaskList ?? []).map((task) => ({
      ...task,
      id: task._id, 
      quadrant: task.quadrant as QuadrantKeys,
      taskType: task.taskType as TaskOrIdeaType,
      status: task.status as TaskStatus,
      needsReflection: task.needsReflection ?? false,
      reflection: task.reflection ? {
        ...task.reflection,
        suggestedQuadrant: task.reflection.suggestedQuadrant as QuadrantKeys | undefined,
        finalQuadrant: task.reflection.finalQuadrant as QuadrantKeys 
      } : undefined,
    }));
  }, [rawTaskList]);

  return (
    <DashboardLayout tasks={taskList}>
      {/* Changed mb-6 to pb-6 and added border-b-0 */}
      <h1 className="text-2xl font-semibold pb-6 border-b-0">All Goals</h1>

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
