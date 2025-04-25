"use client"

import { Task } from "@/types/task"
import { VelocityMeter } from "@/components/ui/velocity-meter"
import useLocalStorage from '@/hooks/useLocalStorage';

interface VelocityMetersProps {
  tasks: Task[];
}

/**
 * VelocityMeters component - Displays velocity meters for personal and work tasks
 */
export function VelocityMeters({ tasks }: VelocityMetersProps) {
  // Read sidebar visibility setting
  const [showSidebars] = useLocalStorage<boolean>('showEisenhowerSidebars', true);

  // Don't render if tasks are empty OR if sidebars are hidden
  if (!tasks?.length || !showSidebars) return null;
  
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
