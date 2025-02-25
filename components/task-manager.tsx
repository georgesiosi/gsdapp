"use client"

import { TaskInput } from "@/components/task-input"
import { EisenhowerMatrix } from "@/components/eisenhower-matrix"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { exportTasksToCSV } from "@/lib/export-utils"
import { Task, QuadrantType } from "@/types/task"
import { ReflectionCard } from "@/components/ui/reflection-card"
import { useTaskManagement } from "@/components/task/hooks/useTaskManagement"
import { useReflectionSystem } from "@/components/task/hooks/useReflectionSystem"

export function TaskManager() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTaskManagement()
  const { reflectingTask, startReflection, submitReflection, cancelReflection } = useReflectionSystem()
  const { toast } = useToast()

  // Flag to track if tasks are being loaded from localStorage
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Load tasks from localStorage on mount - only once
  useEffect(() => {
    const loadTasks = () => {
      const savedTasks = localStorage.getItem("tasks")
      if (savedTasks) {
        try {
          // Set loading flag to prevent saving during initial load
          setIsLoadingTasks(true);
          
          // Parse saved tasks
          const parsedTasks = JSON.parse(savedTasks) as Task[];
          
          // Create a new array of tasks with the same IDs to avoid regenerating them
          const loadedTasks: Task[] = [];
          
          parsedTasks.forEach((task: Task) => {
            loadedTasks.push({
              ...task,
              // Keep the original ID and timestamps
              id: task.id,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt
            });
          });
          
          // Use the useTaskManagement hook's internal setTasks function
          // This is a workaround since we can't directly access setTasks
          // We'll clear the tasks first by setting an empty array
          // Then add each task individually
          
          // First, clear any existing tasks by setting an empty array
          // We do this by calling updateTask on a non-existent ID
          updateTask("clear-all-tasks", { quadrant: "q4" });
          
          // Then add each task individually
          loadedTasks.forEach(task => {
            addTask({
              text: task.text,
              quadrant: task.quadrant,
              completed: task.completed,
              needsReflection: task.needsReflection,
              reflection: task.reflection
            });
          });
        } catch (error) {
          console.error("Error loading tasks:", error)
        } finally {
          // Small delay to ensure all tasks are added before enabling saving
          setTimeout(() => {
            setIsLoadingTasks(false);
          }, 500);
        }
      } else {
        setIsLoadingTasks(false);
      }
    };
    
    // Load tasks only once on mount
    loadTasks();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array to ensure it only runs once

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    // Only save tasks if we're not in the loading phase
    if (!isLoadingTasks) {
      localStorage.setItem("tasks", JSON.stringify(tasks))
    }
  }, [tasks, isLoadingTasks])

  const handleAddTask = async (text: string) => {
    const newTask = addTask({
      text,
      quadrant: "q4",
      completed: false,
      needsReflection: false
    })

    try {
      // Get goal and priority from localStorage
      const goal = localStorage.getItem("savedGoal") || ""
      const priority = localStorage.getItem("savedPriority") || ""

      const response = await fetch("/api/categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task: text, goal, priority }),
      })

      if (!response.ok) {
        throw new Error("Failed to categorize task")
      }

      const data = await response.json()
      
      // Update the task with the AI-suggested quadrant
      if (data.category && newTask) {
        // Ensure the category is a valid QuadrantType
        const category = data.category as string;
        if (["q1", "q2", "q3", "q4"].includes(category)) {
          updateTask(newTask.id, {
            quadrant: category as "q1" | "q2" | "q3" | "q4"
          });
        }
      }
    } catch (error) {
      console.error("Error categorizing task:", error)
      // Task is already added with default quadrant, so we don't need to handle this error
    }
  }

  const handleMoveTask = (taskId: string, newQuadrant: string) => {
    // Ensure the quadrant is a valid QuadrantType
    if (["q1", "q2", "q3", "q4"].includes(newQuadrant)) {
      updateTask(taskId, { quadrant: newQuadrant as QuadrantType })
    }
  }

  const handleExportTasks = () => {
    exportTasksToCSV()
    toast({
      title: "Tasks Exported",
      description: "Your tasks have been exported to CSV",
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center gap-3 mb-3">
        <div className="flex-1">
          <TaskInput onAddTask={handleAddTask} />
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportTasks}
          className="h-9 text-xs"
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Export
        </Button>
      </div>

      <div className="mt-4">
        <EisenhowerMatrix
          tasks={tasks}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onReflectionRequested={startReflection}
          onMoveTask={handleMoveTask}
        />
      </div>

      {reflectingTask && (
        <ReflectionCard
          task={reflectingTask}
          onSubmit={submitReflection}
          onCancel={cancelReflection}
        />
      )}
    </div>
  )
}
