import { useState, useCallback } from 'react';
import { Task } from '@/types/task';
import { ReflectionService } from '@/services/task/reflectionService';

export function useReflectionSystem() {
  const [reflectingTask, setReflectingTask] = useState<Task | null>(null);
  const reflectionService = new ReflectionService();

  const startReflection = useCallback((task: Task) => {
    if (reflectionService.needsReflection(task)) {
      setReflectingTask(task);
    }
  }, []);

  const submitReflection = useCallback(async (reflection: string) => {
    if (!reflectingTask) return null;

    const taskReflection = await reflectionService.analyzeReflection(
      reflectingTask,
      reflection
    );

    setReflectingTask(null);
    return {
      task: reflectingTask,
      reflection: taskReflection,
    };
  }, [reflectingTask]);

  const cancelReflection = useCallback(() => {
    setReflectingTask(null);
  }, []);

  return {
    reflectingTask,
    startReflection,
    submitReflection,
    cancelReflection,
  };
}
