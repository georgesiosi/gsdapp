"use client"

// Temporarily disabled while fixing Convex DB setup
// import { Task } from "@/types/task"
// import { VelocityMeter } from "@/components/ui/velocity-meter"

/**
 * VelocityMeters component - temporarily disabled while fixing Convex DB setup
 * Will be re-enabled once the database migration is complete
 */
export function VelocityMeters() {
  // Temporarily disabled while fixing Convex DB setup
  return null;
  
  /* Original implementation:
  const personalTasks = tasks.filter(t => t.taskType === "personal" || t.taskType === undefined);
  const workTasks = tasks.filter(t => t.taskType === "work" || t.taskType === "business");
  */
  
  /* Original implementation - temporarily commented out
  return (
    <>
      <VelocityMeter 
        tasks={tasks} 
        type="personal" 
        position="left" 
      />
      
      <VelocityMeter 
        tasks={tasks} 
        type="work" 
        position="right" 
      />
    </>
  )
  */
}
