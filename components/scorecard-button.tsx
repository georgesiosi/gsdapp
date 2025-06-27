"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EndDayScorecard } from "@/components/end-day-scorecard";
import { BarChart2Icon } from "lucide-react";
import type {
  QuadrantKeys,
  TaskType,
  TaskStatus,
} from "@/types/task"; // Import necessary types

interface ScorecardButtonProps {
  className?: string;
}

export function ScorecardButton({ className }: ScorecardButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch all tasks from Convex
  const convexTasks = useQuery(api.tasks.getTasks) ?? [];

  // Map Convex tasks (_id, goalId) to the Task interface (id, goalId)
  const mappedTasks = convexTasks.map(task => ({
    ...task,
    id: task._id.toString(),           // Map _id to string id
    quadrant: task.quadrant as QuadrantKeys, // Cast quadrant
    taskType: task.taskType as TaskType | undefined, // Cast taskType
    goalId: task.goalId?.toString(), // Map optional goalId
    status: task.status as TaskStatus, // Cast status
    needsReflection: task.needsReflection ?? false, // Default needsReflection
    // Handle optional reflection object and cast its quadrant fields
    reflection: task.reflection
      ? ({
          ...task.reflection,
          suggestedQuadrant:
            task.reflection.suggestedQuadrant as QuadrantKeys | undefined,
          finalQuadrant: task.reflection.finalQuadrant as QuadrantKeys,
        } as TaskReflection)
      : undefined,
  }));

  // Filter mapped tasks for the scorecard
  const tasksForScorecard = mappedTasks.filter(
    t => t.status === 'active' || t.status === 'completed'
  );

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenDialog}
        className={className}
      >
        <BarChart2Icon className="h-4 w-4 mr-2" />
        Generate Scorecard
      </Button>

      <EndDayScorecard
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        tasks={tasksForScorecard} // Pass the fetched and mapped tasks
      />
    </>
  );
}
