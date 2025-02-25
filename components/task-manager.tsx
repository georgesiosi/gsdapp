"use client"

import { TaskInput } from "@/components/task-input"
import { EisenhowerMatrix } from "@/components/eisenhower-matrix"
import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { exportTasksToCSV } from "@/lib/export-utils"
import { Task } from "@/types/task"
import { ReflectionCard } from "@/components/ui/reflection-card"
import { useTaskManagement } from "@/components/task/hooks/useTaskManagement"
import { useReflectionSystem } from "@/components/task/hooks/useReflectionSystem"

export function TaskManager() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTaskManagement()
  const { reflectingTask, startReflection, submitReflection, cancelReflection } = useReflectionSystem()
  const { toast } = useToast()

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks")
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks)
        parsedTasks.forEach((task: Task) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, createdAt, updatedAt, ...taskData } = task;
          addTask(taskData);
        })
      } catch (error) {
        console.error("Error loading tasks:", error)
      }
    }
  }, [addTask])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  const handleAddTask = async (text: string) => {
    const newTask = addTask({
      text,
      quadrant: "q4",
      completed: false,
      needsReflection: false
    })

    try {
      const response = await fetch("/api/categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error("Failed to categorize task")
      }

      const data = await response.json()
      
      // Update the task with the AI-suggested quadrant
      if (data.quadrant && newTask) {
        updateTask(newTask.id, {
          quadrant: data.quadrant
        })
      }
    } catch (error) {
      console.error("Error categorizing task:", error)
      // Task is already added with default quadrant, so we don't need to handle this error
    }
  }

  const handleMoveTask = (taskId: string, newQuadrant: string) => {
    updateTask(taskId, { quadrant: newQuadrant })
  }

  const handleExportTasks = () => {
    exportTasksToCSV(tasks)
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
          size="sm" 
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
