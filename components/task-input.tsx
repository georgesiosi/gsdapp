"use client"

import type React from "react"
import { useState } from "react"
import { Plus } from "lucide-react"
import { TaskCreationSuggestions } from './ui/task-creation-suggestions';

interface TaskInputProps {
  onAddTask: (text: string) => Promise<void>
}

export function TaskInput({ onAddTask }: TaskInputProps) {
  const [newTask, setNewTask] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim() && !isSubmitting) {
      setIsSubmitting(true)
      await onAddTask(newTask.trim())
      setNewTask("")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="task-input-container">
      <div className="task-input-header">Add New Task</div>
      <div className="task-input-content">
        <form onSubmit={handleSubmit} className="task-input-form">
          <div className="space-y-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What needs to be done?"
              className="task-input"
              disabled={isSubmitting}
            />
            <TaskCreationSuggestions taskText={newTask} />
          </div>
          <button 
            type="submit" 
            className="add-task-button" 
            disabled={isSubmitting}
          >
            <Plus size={14} className="mr-1" />
            Add Task
          </button>
        </form>
      </div>
    </div>
  )
}
