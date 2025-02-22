"use client"

import { TaskInput } from "@/components/task-input"
import { EisenhowerMatrix } from "@/components/eisenhower-matrix"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { exportTasksToCSV } from "@/lib/export-utils"

interface Task {
  id: string
  text: string
  quadrant: "q1" | "q2" | "q3" | "q4"
  completed: boolean
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const { toast } = useToast()

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks")
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks))
      } catch (error) {
        console.error("Error loading tasks:", error)
      }
    }
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  const addTask = async (text: string) => {
    // Default to q4 initially
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      quadrant: "q4",
      completed: false,
    }

    // Add the task immediately for better UX
    setTasks((prev) => [...prev, newTask])

    try {
      const response = await fetch("/api/categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: text,
          goal: localStorage.getItem("mainGoal") || "",
          priority: localStorage.getItem("dailyPriority") || "",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to categorize task")
      }

      const data = await response.json()

      // Update the task's quadrant based on AI categorization
      if (data.category) {
        setTasks((prev) => prev.map((t) => (t.id === newTask.id ? { ...t, quadrant: data.category } : t)))

        if (data.category !== "q4") {
          toast({
            title: "Task Categorized",
            description: `Task placed in ${getQuadrantTitle(data.category)} based on your goal and priority`,
          })
        }
      }
    } catch (error) {
      toast({
        title: "Task Added",
        description: "Could not auto-categorize task. Placed in Not Urgent & Not Important.",
        variant: "destructive",
      })
    }
  }

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const getQuadrantTitle = (quadrant: Task["quadrant"]): string => {
    const titles = {
      q1: "Urgent & Important",
      q2: "Important, Not Urgent",
      q3: "Urgent, Not Important",
      q4: "Not Urgent & Not Important",
    }
    return titles[quadrant]
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <TaskInput onAddTask={addTask} />
        </div>
        {tasks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportTasksToCSV()
              toast({
                title: "Tasks Exported",
                description: "Your tasks have been exported to CSV",
              })
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            Export Tasks
          </Button>
        )}
      </div>
      <EisenhowerMatrix tasks={tasks} onToggleTask={toggleTask} onDeleteTask={deleteTask} />
    </div>
  )
}

