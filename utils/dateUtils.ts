// Date utility functions
import { Task } from '@/types/task';

export const isTaskFromToday = (task: Task): boolean => {
  try {
    const taskDate = new Date(task.createdAt).toLocaleDateString();
    const completionDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString() : null;
    const today = new Date().toLocaleDateString();
    
    return taskDate === today || 
           completionDate === today ||
           task.status === 'active';
  } catch (error) {
    console.error('Error parsing task dates:', error);
    return false;
  }
};

export const formatTaskDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString();
  } catch (error) {
    console.error('Error formatting task date:', error);
    return 'Invalid Date';
  }
};
