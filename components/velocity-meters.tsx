"use client"

import { Task } from "@/types/task"
import { VelocityMeter } from "@/components/ui/velocity-meter"

interface VelocityMetersProps {
  tasks: Task[]
}

export function VelocityMeters({ tasks }: VelocityMetersProps) {
  // Debug all tasks and their types
  console.log("[DEBUG] VelocityMeters - All tasks count:", tasks.length);
  
  // Count tasks by type
  const personalTasks = tasks.filter(t => t.taskType === "personal" || t.taskType === undefined).length;
  const workTasks = tasks.filter(t => t.taskType === "work" || t.taskType === "business").length;
  const unknownTasks = tasks.filter(t => !t.taskType || (t.taskType !== "personal" && t.taskType !== "work" && t.taskType !== "business")).length;
  
  console.log("[DEBUG] VelocityMeters - Task type counts:", {
    personal: personalTasks,
    work: workTasks,
    unknown: unknownTasks
  });
  
  // Log task types for all tasks
  console.log("[DEBUG] VelocityMeters - Task types:", tasks.map(t => ({
    id: t.id,
    text: t.text.substring(0, 20) + (t.text.length > 20 ? '...' : ''),
    taskType: t.taskType,
    completed: t.completed
  })));
  
  return (
    <>
      {/* Personal Tasks Velocity Meter (Left side) */}
      <VelocityMeter 
        tasks={tasks} 
        type="personal" 
        position="left" 
      />
      
      {/* Work Tasks Velocity Meter (Right side) - includes both work and business tasks */}
      <VelocityMeter 
        tasks={tasks} 
        type="work" 
        position="right" 
      />
    </>
  )
}
