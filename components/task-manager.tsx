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
  }, [])

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
        const needsReflection = data.category === "q3" || data.category === "q4"
        updateTask(newTask.id, {
          quadrant: data.category,
          needsReflection
        })

        if (needsReflection) {
          const updatedTask = tasks.find(t => t.id === newTask.id);
          if (updatedTask) startReflection(updatedTask);
        }

        if (data.category !== "q4") {
          toast({
            title: "Task Categorized",
            description: `Task placed in ${getQuadrantTitle(data.category)} based on your goal and priority`,
          })
        }
      }
    } catch {
      toast({
        title: "Task Added",
        description: "Could not auto-categorize task. Placed in Not Urgent & Not Important.",
        variant: "destructive",
      })
    }
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

  const handleReflection = async (taskId: string, justification: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    try {
      const result = await submitReflection(justification)
      if (!result) return

      const { reflection: taskReflection } = result

      updateTask(taskId, {
        needsReflection: false,
        quadrant: taskReflection.suggestedQuadrant || task.quadrant,
        reflection: {
          content: justification,
          ...taskReflection,
        },
        updatedAt: new Date().toISOString()
      })

      toast({
        title: "Task Updated",
        description: taskReflection.feedback || "Task has been recategorized based on your reflection",
      })
    } catch (error) {
      console.error("Error handling reflection:", error)
      toast({
        title: "Error",
        description: "Failed to process reflection",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <TaskInput onAddTask={handleAddTask} />
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
      <EisenhowerMatrix 
        tasks={tasks} 
        onToggleTask={toggleTask} 
        onDeleteTask={deleteTask} 
        onReflectionRequested={startReflection}
        onMoveTask={(taskId, newQuadrant) => {
          const task = tasks.find(t => t.id === taskId);
          if (!task) return;

          const needsReflection = (newQuadrant === "q3" || newQuadrant === "q4");
          updateTask(taskId, { 
            quadrant: newQuadrant,
            needsReflection
          });

          if (needsReflection) {
            const updatedTask = tasks.find(t => t.id === taskId);
            if (updatedTask) startReflection(updatedTask);
          }

          toast({
            title: "Task Moved",
            description: `Task moved to ${getQuadrantTitle(newQuadrant)}`,
          });
        }}
      />
      {reflectingTask && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <ReflectionCard
            task={reflectingTask}
            onClose={cancelReflection}
            onReflectionComplete={handleReflection}
          />
        </div>
      )}
    </div>
  )
}
