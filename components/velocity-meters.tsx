"use client"

import { Task } from "@/types/task"
import { VelocityMeter } from "@/components/ui/velocity-meter"

interface VelocityMetersProps {
  tasks: Task[];
}

/**
 * VelocityMeters component - Displays velocity meters for personal and work tasks
 */
export function VelocityMeters({ tasks }: VelocityMetersProps) {
  if (!tasks?.length) return null;
  
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
}
