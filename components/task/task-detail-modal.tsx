"use client"

import * as React from "react"
import { Task } from "@/types/task"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTaskManagement } from "./hooks/useTaskManagement"
import { useToast } from "@/components/ui/use-toast"
import { getStorage } from "@/lib/storage"

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = React.useState(false)
  const { updateTask, deleteTask } = useTaskManagement()
  const { toast } = useToast()
  const [title, setTitle] = React.useState(task?.text ?? "")
  const [description, setDescription] = React.useState(task?.description ?? "")
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDirty, setIsDirty] = React.useState(false)
  const [pendingChanges, setPendingChanges] = React.useState<Partial<Task>>({})

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen && task) {
      setTitle(task.text)
      setDescription(task.description ?? "")
      setIsDirty(false)
      setPendingChanges({})
    } else {
      setTitle("")
      setDescription("")
      setIsDirty(false)
      setPendingChanges({})
    }
  }, [isOpen, task])

  const saveChanges = React.useCallback(async () => {
    if (!task?.id || !isDirty) return;
    
    console.log('[DEBUG] TaskDetailModal - Saving changes:', pendingChanges);
    setIsSaving(true);
    
    // First update local state
    const storedTasks = getStorage('TASKS') as Task[] | null;
    if (storedTasks) {
      const taskIndex = storedTasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        const updatedTask = {
          ...storedTasks[taskIndex],
          ...pendingChanges,
          updatedAt: new Date().toISOString()
        };
        storedTasks[taskIndex] = updatedTask;
        
        // Dispatch update event before actual save for immediate UI update
        const preUpdateEvent = new CustomEvent('taskUpdated', {
          detail: { 
            taskId: task.id, 
            updates: pendingChanges,
            updatedTask,
            source: 'taskDetailModal-pre'
          }
        });
        window.dispatchEvent(preUpdateEvent);
      }
    }
    
    // Then do the actual update
    const result = updateTask(task.id, pendingChanges, false);
    
    if (result.success) {
      setIsDirty(false);
      setPendingChanges({});
      toast({
        title: "Changes saved",
        description: "Task has been updated successfully",
      });
      
      // Dispatch another event after successful save
      const postUpdateEvent = new CustomEvent('taskUpdated', {
        detail: { 
          taskId: task.id, 
          updates: pendingChanges,
          source: 'taskDetailModal-post'
        }
      });
      window.dispatchEvent(postUpdateEvent);
    } else {
      toast({
        title: "Failed to save changes",
        description: result.error || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsSaving(false);
  }, [task?.id, isDirty, pendingChanges, updateTask, toast]);

  // Listen for task updates from other components
  React.useEffect(() => {
    const handleTaskUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.taskId === task?.id) {
        console.log('[DEBUG] TaskDetailModal - Received task update:', customEvent.detail);
        // Update our local state if needed
        if (customEvent.detail.updatedTask) {
          setTitle(customEvent.detail.updatedTask.text);
          setDescription(customEvent.detail.updatedTask.description ?? "");
        }
      }
    };
    
    window.addEventListener('taskUpdated', handleTaskUpdate);
    return () => window.removeEventListener('taskUpdated', handleTaskUpdate);
  }, [task?.id]);

  const handleTitleChange = React.useCallback(
    (value: string) => {
      setTitle(value);
      setIsDirty(true);
      setPendingChanges(prev => ({ ...prev, text: value }));
    },
    []
  );

  const handleTitleBlur = React.useCallback(
    () => {
      if (isDirty) saveChanges();
    },
    [isDirty, saveChanges]
  );

  const handleDescriptionChange = React.useCallback(
    (value: string) => {
      setDescription(value);
      setIsDirty(true);
      setPendingChanges(prev => ({ ...prev, description: value }));
    },
    []
  );

  const handleDescriptionBlur = React.useCallback(
    () => {
      // Always save when description field is blurred to prevent data loss
      saveChanges();
    },
    [saveChanges]
  )

  const handleStatusChange = React.useCallback(
    async (value: string) => {
      const newStatus = value as "active" | "completed";
      setPendingChanges(prev => ({ ...prev, status: newStatus }));
      setIsDirty(true);
      
      // Auto-save immediately with forced, non-batched update
      if (task?.id) {
        setIsSaving(true);
        console.log(`[DEBUG] Updating task status to ${newStatus}`);
        const result = updateTask(task.id, { 
          status: newStatus,
          // If completing, add completedAt timestamp
          ...(newStatus === 'completed' ? { completedAt: new Date().toISOString() } : {})
        }, false); // false = non-batched for immediate update
        
        if (result.success) {
          setIsDirty(false);
          setPendingChanges({});
          // Force a DOM update
          window.dispatchEvent(new CustomEvent('taskUpdated', {
            detail: { 
              taskId: task.id, 
              updates: { status: newStatus },
              source: 'taskDetailModal'
            }
          }));
        } else {
          toast({
            title: "Failed to update status",
            description: result.error || "An unexpected error occurred",
            variant: "destructive",
          });
        }
        setIsSaving(false);
      }
    },
    [task?.id, updateTask, toast]
  )

  const handleQuadrantChange = React.useCallback(
    async (value: string) => {
      const newQuadrant = value as "q1" | "q2" | "q3" | "q4";
      setPendingChanges(prev => ({ ...prev, quadrant: newQuadrant }));
      setIsDirty(true);
      
      // Auto-save immediately with forced, non-batched update
      if (task?.id) {
        setIsSaving(true);
        console.log(`[DEBUG] Moving task to quadrant ${newQuadrant}`);
        
        // Find the highest order in this quadrant to place this task at the end
        const tasksInStorage = getStorage('TASKS') as Task[] | null;
        const quadrantTasks = tasksInStorage?.filter(t => t.quadrant === newQuadrant) || [];
        const maxOrder = quadrantTasks.length > 0 
          ? Math.max(...quadrantTasks.map(t => t.order || 0)) 
          : -1;
        
        const result = updateTask(task.id, { 
          quadrant: newQuadrant,
          order: maxOrder + 1 // Place at the end of the destination quadrant
        }, false); // false = non-batched for immediate update
        
        if (result.success) {
          setIsDirty(false);
          setPendingChanges({});
          // Force a DOM update
          window.dispatchEvent(new CustomEvent('taskUpdated', {
            detail: { 
              taskId: task.id, 
              updates: { quadrant: newQuadrant },
              source: 'taskDetailModal'
            }
          }));
        } else {
          toast({
            title: "Failed to update quadrant",
            description: result.error || "An unexpected error occurred",
            variant: "destructive",
          });
        }
        setIsSaving(false);
      }
    },
    [task?.id, updateTask, toast]
  )

  const [isDeleting, setIsDeleting] = React.useState(false)
  const [retryAttempt, setRetryAttempt] = React.useState(0)
  const maxRetries = 3

  const handleDelete = React.useCallback(async () => {
    if (task?.id) {
      setIsDeleting(true)
      const result = deleteTask(task.id)
      if (result.success) {
        onClose()
        toast({
          title: "Task deleted",
          description: "The task has been permanently removed",
        })
      } else {
        if (retryAttempt < maxRetries) {
          setRetryAttempt(prev => prev + 1)
          toast({
            title: "Retrying...",
            description: `Attempt ${retryAttempt + 1}/${maxRetries}. ${result.error || 'Please wait...'}`,
          })
          // Retry after a delay with exponential backoff
          setTimeout(handleDelete, Math.pow(2, retryAttempt) * 1000)
        } else {
          toast({
            title: "Failed to delete task",
            description: result.error || "An unexpected error occurred",
            variant: "destructive",
          })
          setRetryAttempt(0) // Reset for next attempt
        }
      }
      setIsDeleting(false)
    }
  }, [task?.id, deleteTask, onClose, toast, retryAttempt])

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && isDirty) {
          setShowUnsavedChangesAlert(true)
        } else if (!open) {
          onClose()
        }
      }}
    >
      <AlertDialog open={showUnsavedChangesAlert} onOpenChange={setShowUnsavedChangesAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsDirty(false)
                setPendingChanges({})
                setShowUnsavedChangesAlert(false)
                onClose()
              }}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DialogContent className="sm:max-w-[625px]">
        {!task ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading task details...</div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle asChild>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      onBlur={handleTitleBlur}
                      className={`text-xl font-bold w-full transition-colors ${isDirty ? 'border-blue-500' : ''}`}
                      placeholder="Task title"
                      aria-label="Task title"
                    />
                  </div>
                  {isSaving && (
                    <div className="text-xs text-muted-foreground animate-pulse whitespace-nowrap">
                      Saving...
                    </div>
                  )}
                </div>
              </DialogTitle>
              <DialogDescription>
                {task.status === 'completed' ? 'Completed task' : 'Active task'} in the {task.quadrant.toLowerCase()} quadrant
              </DialogDescription>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger 
                  id="status" 
                  aria-label="Task status"
                  className={`transition-colors ${isDirty ? 'border-blue-500' : ''}`}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quadrant">Quadrant</Label>
              <Select defaultValue={task.quadrant} onValueChange={handleQuadrantChange}>
                <SelectTrigger 
                  id="quadrant" 
                  aria-label="Task quadrant"
                  className={`transition-colors ${isDirty ? 'border-blue-500' : ''}`}
                >
                  <SelectValue placeholder="Select quadrant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="q1" aria-label="Urgent and Important">Urgent & Important</SelectItem>
                  <SelectItem value="q2" aria-label="Not Urgent but Important">Not Urgent but Important</SelectItem>
                  <SelectItem value="q3" aria-label="Urgent but Not Important">Urgent but Not Important</SelectItem>
                  <SelectItem value="q4" aria-label="Not Urgent and Not Important">Not Urgent & Not Important</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-muted-foreground">
                Created on {new Date(task.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
            </DialogHeader>

            <div className="mt-4 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Add more details about this task..."
                className={`min-h-[100px] transition-colors ${isDirty ? 'border-blue-500' : ''}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <div>{description.length} characters</div>
                {isSaving && <div className="animate-pulse">Saving...</div>}
              </div>
            </div>
            <DialogFooter className="mt-6">
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="mr-auto"
            loading={isDeleting}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Task"}
          </Button>
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button
                onClick={async () => {
                  if (!task?.id) return;
                  
                  // Log that we're saving
                  console.log('[DEBUG] Saving pending changes:', pendingChanges);
                  
                  setIsSaving(true);
                  // Use the non-batch mode for immediate update to prevent UI lag
                  const result = updateTask(task.id, pendingChanges, false);
                  
                  // Add a small delay to ensure the DOM has time to update
                  await new Promise(resolve => setTimeout(resolve, 300));
                  
                  if (result.success) {
                    setIsDirty(false);
                    setPendingChanges({});
                    toast({
                      title: "Changes saved",
                      description: "Task has been updated successfully",
                    });
                    
                    // Dispatch our own event to ensure the UI updates
                    const updateEvent = new CustomEvent('taskUpdated', {
                      detail: { 
                        taskId: task.id, 
                        updates: pendingChanges,
                        source: 'taskDetailModal' 
                      }
                    });
                    window.dispatchEvent(updateEvent);
                  } else {
                    // Show error toast and keep the form dirty
                    toast({
                      title: "Failed to save changes",
                      description: result.error || "An unexpected error occurred. Please try again.",
                      variant: "destructive",
                    });
                  }
                  
                  setIsSaving(false);
                }}
                loading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (isDirty) {
                  setShowUnsavedChangesAlert(true)
                } else {
                  onClose()
                }
              }}
            >
              {isDirty ? "Discard Changes" : "Close"}
            </Button>
          </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
