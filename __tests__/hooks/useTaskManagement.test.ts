import { renderHook, act } from '@testing-library/react-hooks';
import { useTaskManagement } from '../../components/task/hooks/useTaskManagement';

// We'll use these to track the generated UUIDs
let taskIds: string[] = [];

jest.mock('uuid', () => ({
  v4: jest.fn(() => {
    const id = `test-uuid-value-${taskIds.length}`;
    taskIds.push(id);
    return id;
  }),
}));

describe('useTaskManagement', () => {
  // Reset the taskIds array before each test
  beforeEach(() => {
    taskIds = [];
  });

  // Test initial state
  test('should initialize with empty tasks array', () => {
    const { result } = renderHook(() => useTaskManagement());
    expect(result.current.tasks).toEqual([]);
  });

  // Test setInitialTasks
  test('should set initial tasks correctly', () => {
    const { result } = renderHook(() => useTaskManagement());
    
    const initialTasks = [
      {
        id: '1',
        text: 'Test task 1',
        quadrant: 'q1' as const,
        completed: false,
        needsReflection: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: '2',
        text: 'Test task 2',
        quadrant: 'q2' as const,
        completed: true,
        needsReflection: false,
        createdAt: Date.now() - 1000,
        completedAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    act(() => {
      result.current.setInitialTasks(initialTasks);
    });

    expect(result.current.tasks).toEqual(initialTasks);
  });

  // Test setInitialTasks with invalid data
  test('should filter out invalid tasks when setting initial tasks', () => {
    const { result } = renderHook(() => useTaskManagement());
    const validTask = {
      id: '1',
      text: 'Valid task',
      quadrant: 'q1' as const,
      completed: false,
      needsReflection: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const invalidTasks = [
      validTask,
      { id: '2', text: 'Missing properties', quadrant: 'q1', completed: false, needsReflection: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '3', text: 'Invalid quadrant', quadrant: 'q1', completed: false, needsReflection: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      null,
      undefined,
    ];

    act(() => {
      result.current.setInitialTasks(invalidTasks);
    });

    // Should only have the valid task
    expect(result.current.tasks).toEqual([validTask]);
  });

  // Test addTask
  test('should add a new task', () => {
    const { result } = renderHook(() => useTaskManagement());
    
    let task;
    act(() => {
      task = result.current.addTask({
        text: 'New task',
        quadrant: 'q3',
        completed: false,
        needsReflection: false,
      });
      if (task) {
        taskIds.push(task.id);
      }
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].text).toBe('New task');
    expect(result.current.tasks[0].quadrant).toBe('q3');
    expect(result.current.tasks[0].id).toBeDefined();
    expect(result.current.tasks[0].createdAt).toBeDefined();
    expect(result.current.tasks[0].updatedAt).toBeDefined();
  });

  // Test updateTask
  test('should update an existing task', () => {
    const { result } = renderHook(() => useTaskManagement());
    
    // First add a task
    let taskId: string;
    act(() => {
      const task = result.current.addTask({
        text: 'Task to update',
        quadrant: 'q4',
        completed: false,
        needsReflection: false,
      });
      taskId = task!.id;
    });

    // Then update it
    act(() => {
      const updated = result.current.updateTask(taskId, {
        text: 'Updated task',
        quadrant: 'q1',
      });
      expect(updated).toBe(true);
    });

    expect(result.current.tasks[0].text).toBe('Updated task');
    expect(result.current.tasks[0].quadrant).toBe('q1');
    expect(result.current.tasks[0].completed).toBe(false); // Unchanged
    expect(result.current.tasks[0].updatedAt).toBeDefined();
  });

  // Test updateTask with non-existent ID
  test('should return false when updating non-existent task', () => {
    const { result } = renderHook(() => useTaskManagement());
    
    act(() => {
      const updated = result.current.updateTask('non-existent-id', {
        text: 'This update should fail',
      });
      expect(updated).toBe(false);
    });

    expect(result.current.tasks).toHaveLength(0);
  });

  // Test deleteTask
  test('should delete an existing task', () => {
    const { result } = renderHook(() => useTaskManagement());
    
    // First add a task
    let taskId: string;
    act(() => {
      const task = result.current.addTask({
        text: 'Task to delete',
        quadrant: 'q2',
        completed: false,
        needsReflection: false,
      });
      taskId = task!.id;
    });

    expect(result.current.tasks).toHaveLength(1);

    // Then delete it
    act(() => {
      const deleted = result.current.deleteTask(taskId);
      expect(deleted).toBe(true);
    });

    expect(result.current.tasks).toHaveLength(0);
  });

  // Test deleteTask with non-existent ID
  test('should return false when deleting non-existent task', () => {
    const { result } = renderHook(() => useTaskManagement());
    
    act(() => {
      const deleted = result.current.deleteTask('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  // Test toggleTask
  test('should toggle task completion status', () => {
    const { result } = renderHook(() => useTaskManagement());
    
    // First add a task
    let taskId: string;
    act(() => {
      const task = result.current.addTask({
        text: 'Task to toggle',
        quadrant: 'q1',
        completed: false,
        needsReflection: false,
      });
      taskId = task!.id;
    });

    // Toggle to completed
    act(() => {
      const toggled = result.current.toggleTask(taskId);
      expect(toggled).toBe(true);
    });

    expect(result.current.tasks[0].completed).toBe(true);
    expect(result.current.tasks[0].completedAt).toBeDefined();
    expect(result.current.tasks[0].updatedAt).toBeDefined();

    // Toggle back to incomplete
    act(() => {
      result.current.toggleTask(taskId);
    });

    expect(result.current.tasks[0].completed).toBe(false);
    expect(result.current.tasks[0].completedAt).toBeUndefined();
    expect(result.current.tasks[0].updatedAt).toBeDefined();
  });

  // Test toggleTask with non-existent ID
  test('should return false when toggling non-existent task', () => {
    const { result } = renderHook(() => useTaskManagement());
    
    act(() => {
      const toggled = result.current.toggleTask('non-existent-id');
      expect(toggled).toBe(false);
    });
  });
});
