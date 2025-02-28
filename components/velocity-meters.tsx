"use client"

import { VelocityMeter } from "@/components/ui/velocity-meter"
import { Task } from "@/types/task"

interface VelocityMetersProps {
  tasks: Task[]
}

export function VelocityMeters({ tasks }: VelocityMetersProps) {
  return (
    <>
      {/* Personal Tasks Velocity Meter (Left side) */}
      <VelocityMeter 
        tasks={tasks} 
        type="personal" 
        position="left" 
      />
      
      {/* Work Tasks Velocity Meter (Right side) */}
      <VelocityMeter 
        tasks={tasks} 
        type="work" 
        position="right" 
      />
    </>
  )
}
