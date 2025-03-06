// Date utility functions
import { Task } from '@/types/task';

// Type guard to check if a date string is valid
export const isValidDateString = (dateString: unknown): dateString is string => {
  if (typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Type guard to check if a task has valid dates
export const hasValidDates = (task: Task): boolean => {
  const hasValidCreatedAt = isValidDateString(task.createdAt);
  const hasValidUpdatedAt = isValidDateString(task.updatedAt);
  const hasValidCompletedAt = !task.completedAt || isValidDateString(task.completedAt);
  
  if (!hasValidCreatedAt || !hasValidUpdatedAt || !hasValidCompletedAt) {
    console.error(`[ERROR] Invalid dates in task ${task.id}:`, {
      taskText: task.text.substring(0, 20),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
      hasValidCreatedAt,
      hasValidUpdatedAt,
      hasValidCompletedAt
    });
    return false;
  }
  
  return true;
};

export const isTaskFromToday = (task: Task): boolean => {
  try {
    // First validate task dates
    if (!hasValidDates(task)) {
      console.error(`[ERROR] Task ${task.id} has invalid dates, cannot check if from today`);
      return false;
    }
    
    const now = new Date();
    
    // For completed tasks, check if they were completed today
    if (task.status === 'completed' && task.completedAt) {
      if (!isValidDateString(task.completedAt)) {
        console.error(`[ERROR] Task ${task.id} has invalid completedAt date:`, task.completedAt);
        return false;
      }
      
      const completionDate = new Date(task.completedAt);
      const isCompletedToday = isSameDay(completionDate, now);
      
      console.log(`[DEBUG] Task ${task.id} completion check:`, {
        taskText: task.text.substring(0, 20),
        completedAt: task.completedAt,
        isCompletedToday,
        status: task.status
      });
      
      return isCompletedToday;
    }
    
    // For active tasks, check if they were created today
    if (!isValidDateString(task.createdAt)) {
      console.error(`[ERROR] Task ${task.id} has invalid createdAt date:`, task.createdAt);
      return false;
    }
    
    const creationDate = new Date(task.createdAt);
    const isCreatedToday = isSameDay(creationDate, now);
    
    console.log(`[DEBUG] Task ${task.id} creation check:`, {
      taskText: task.text.substring(0, 20),
      createdAt: task.createdAt,
      isCreatedToday,
      status: task.status
    });
    
    return isCreatedToday;
  } catch (error) {
    console.error('Error checking if task is from today:', error);
    return false;
  }
};

export const formatTaskDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string');
    }
    
    // Format with date and time in a consistent format
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleString('en-US', options);
  } catch (error) {
    console.error('Error formatting task date:', error);
    return 'Invalid Date';
  }
};

// Helper function to get start of day for a given date
export const getStartOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// Helper function to check if two dates are the same day
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return getStartOfDay(date1).getTime() === getStartOfDay(date2).getTime();
};
