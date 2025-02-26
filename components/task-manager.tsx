"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { 
  Download, 
  Plus, 
  Settings
} from "lucide-react"
import { exportTasksToCSV } from "@/lib/export-utils"
import { useTaskManagement } from "@/components/task/hooks/useTaskManagement"
import { useReflectionSystem } from "@/components/task/hooks/useReflectionSystem"
import { EisenhowerMatrix } from "@/components/eisenhower-matrix"
import { TaskModal } from "@/components/task-modal"
import { ReflectionCard } from "@/components/ui/reflection-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TaskManager() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask, setInitialTasks } = useTaskManagement()
  const { reflectingTask, startReflection, submitReflection, cancelReflection } = useReflectionSystem()
  const { toast } = useToast()
  const [taskModalOpen, setTaskModalOpen] = useState(false)

  // Flag to track if tasks are being loaded from localStorage
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const loadTasks = () => {
      try {
        const savedTasks = localStorage.getItem("tasks");
        
        if (savedTasks) {
          try {
            // Parse the saved tasks
            const parsedTasks = JSON.parse(savedTasks);
            
            // Convert string dates to numbers and ensure task structure matches the current Task interface
            const formattedTasks = parsedTasks.map((task: any) => ({
              id: task.id,
              text: task.text,
              quadrant: task.quadrant,
              completed: task.completed,
              needsReflection: task.needsReflection,
              // Convert string dates to numbers or use current timestamp as fallback
              createdAt: typeof task.createdAt === 'string' ? new Date(task.createdAt).getTime() : Date.now(),
              completedAt: task.completedAt ? (typeof task.completedAt === 'string' ? new Date(task.completedAt).getTime() : task.completedAt) : undefined,
              updatedAt: typeof task.updatedAt === 'string' ? new Date(task.updatedAt).getTime() : Date.now()
            }));
            
            setInitialTasks(formattedTasks);
          } catch (error) {
            console.error("Error parsing saved tasks:", error);
            toast({
              title: "Error Loading Tasks",
              description: "There was a problem loading your tasks. Some data may be lost.",
              variant: "destructive",
            });
          }
        }
      } catch (storageError) {
        console.error("Error accessing localStorage:", storageError);
        toast({
          title: "Storage Access Error",
          description: "Could not access local storage. Your tasks may not be saved.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTasks(false);
      }
    };

    loadTasks();
  }, [setInitialTasks, toast]); // Add toast to dependencies

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (!isLoadingTasks) {
      try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
      } catch (error) {
        console.error("Error saving tasks to localStorage:", error);
        toast({
          title: "Error Saving Tasks",
          description: "There was a problem saving your tasks. Changes may not persist.",
          variant: "destructive",
        });
      }
    }
  }, [tasks, isLoadingTasks, toast]); // Add toast to dependencies

  const handleAddTask = (text: string, quadrant: string) => {
    if (!text.trim()) return;
    
    try {
      const newTask = addTask({
        text,
        quadrant: quadrant as "q1" | "q2" | "q3" | "q4",
        completed: false,
        needsReflection: false,
      });
      
      if (newTask) {
        setTaskModalOpen(false);
        toast({
          title: "Task Added",
          description: "Your new task has been added successfully.",
        });
      } else {
        toast({
          title: "Error Adding Task",
          description: "There was a problem adding your task. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in handleAddTask:", error);
      toast({
        title: "Error Adding Task",
        description: "There was a problem adding your task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMoveTask = (taskId: string, newQuadrant: string) => {
    // Ensure the quadrant is a valid QuadrantType
    if (["q1", "q2", "q3", "q4"].includes(newQuadrant)) {
      updateTask(taskId, { quadrant: newQuadrant as "q1" | "q2" | "q3" | "q4" })
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
        <h1 className="text-2xl font-bold">Task Manager</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setTaskModalOpen(true);
            }}
            className="h-9 text-sm px-3 py-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="h-9 text-sm px-3 py-2"
                type="button"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportTasks}>
                <Download className="h-4 w-4 mr-2" />
                Export Tasks
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4">
        <EisenhowerMatrix
          tasks={tasks.map(task => ({
            ...task,
            createdAt: String(task.createdAt),
            updatedAt: String(task.updatedAt),
            completedAt: task.completedAt ? String(task.completedAt) : undefined
          }))}
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

      <TaskModal 
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onAddTask={handleAddTask}
      />
    </div>
  )
}
