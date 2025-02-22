import { useState, useCallback } from 'react';
import { Task } from '@/types/task';
import { TaskService } from '@/services/task/taskService';

export function useTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const taskService = new TaskService();

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask = taskService.createTask(taskData);
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(task => task.id === id);
      if (taskIndex === -1) return prev;

      const updatedTask = taskService.enrichTaskUpdate(prev[taskIndex], updates);
      const newTasks = [...prev];
      newTasks[taskIndex] = updatedTask;
      return newTasks;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(task => task.id === id);
      if (taskIndex === -1) return prev;

      const task = prev[taskIndex];
      const updatedTask = taskService.enrichTaskUpdate(task, { completed: !task.completed });
      const newTasks = [...prev];
      newTasks[taskIndex] = updatedTask;
      return newTasks;
    });
  }, []);

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
  };
}
