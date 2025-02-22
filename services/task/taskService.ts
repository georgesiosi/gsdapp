import { Task } from '@/types/task';

export class TaskService {
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    return {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  enrichTaskUpdate(task: Task, updates: Partial<Task>): Task {
    return {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }
}
