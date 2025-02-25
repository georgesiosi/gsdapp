"use client"

import type React from "react"
import { useState } from "react"
import { Plus } from "lucide-react"

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
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="What needs to be done?"
            className="task-input"
            disabled={isSubmitting}
          />
          <button 
            type="submit" 
            className="add-task-button" 
            disabled={isSubmitting}
          >
            <Plus size={14} className="mr-1" />
            Add Task
          </button>
        </form>
        <button className="export-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Export Tasks
        </button>
      </div>
    </div>
  )
}
