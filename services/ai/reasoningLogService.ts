// AI Reasoning Log Service
// This service handles storing and retrieving AI reasoning logs for task categorization

export interface AIReasoningLog {
  taskId: string;
  taskText: string;
  timestamp: number;
  suggestedQuadrant: string;
  reasoning: string;
  alignmentScore?: number;
  urgencyScore?: number;
  importanceScore?: number;
}

const STORAGE_KEY = 'ai_reasoning_logs';

export class ReasoningLogService {
  /**
   * Store a new reasoning log
   */
  static storeLog(log: AIReasoningLog): void {
    try {
      // Get existing logs
      const existingLogs = this.getLogs();
      
      // Add new log
      const updatedLogs = [log, ...existingLogs];
      
      // Keep only the last 100 logs to prevent localStorage from getting too large
      const trimmedLogs = updatedLogs.slice(0, 100);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Error storing AI reasoning log:', error);
    }
  }
  
  /**
   * Get all reasoning logs
   */
  static getLogs(): AIReasoningLog[] {
    try {
      const logsJson = localStorage.getItem(STORAGE_KEY);
      if (!logsJson) return [];
      
      return JSON.parse(logsJson);
    } catch (error) {
      console.error('Error retrieving AI reasoning logs:', error);
      return [];
    }
  }
  
  /**
   * Get reasoning log for a specific task
   */
  static getLogForTask(taskId: string): AIReasoningLog | null {
    try {
      const logs = this.getLogs();
      return logs.find(log => log.taskId === taskId) || null;
    } catch (error) {
      console.error('Error retrieving AI reasoning log for task:', error);
      return null;
    }
  }
  
  /**
   * Clear all reasoning logs
   */
  static clearLogs(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing AI reasoning logs:', error);
    }
  }

  /**
   * Delete a specific log by task ID
   */
  static deleteLog(taskId: string): boolean {
    try {
      const logs = this.getLogs();
      const filteredLogs = logs.filter(log => log.taskId !== taskId);
      
      // If no logs were removed, return false
      if (filteredLogs.length === logs.length) {
        return false;
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredLogs));
      return true;
    } catch (error) {
      console.error('Error deleting AI reasoning log:', error);
      return false;
    }
  }
  
  /**
   * Get all logs (alias for getLogs for consistency)
   */
  static getAllLogs(): AIReasoningLog[] {
    return this.getLogs();
  }
  
  /**
   * Clear all logs (alias for clearLogs for consistency)
   */
  static clearAllLogs(): void {
    this.clearLogs();
  }
}
