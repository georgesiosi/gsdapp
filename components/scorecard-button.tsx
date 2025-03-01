"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EndDayScorecard } from "@/components/end-day-scorecard";
import { BarChart2Icon } from "lucide-react";
import type { Task } from "@/types/task";

interface ScorecardButtonProps {
  tasks: Task[];
  className?: string;
}

export function ScorecardButton({ tasks, className }: ScorecardButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        tasks={tasks}
      />
    </>
  );
}
