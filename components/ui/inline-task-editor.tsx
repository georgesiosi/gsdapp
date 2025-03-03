"use client"

import { useState, useRef, useEffect } from "react"
import { Task } from "@/components/task/hooks/useTaskManagement"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

interface InlineTaskEditorProps {
  task: Task
  onSave: (taskId: string, newText: string) => void
  onCancel: () => void
  autoFocus?: boolean
}

export function InlineTaskEditor({
  task,
  onSave,
  onCancel,
  autoFocus = true,
}: InlineTaskEditorProps) {
  const [text, setText] = useState(task.text)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
      // Place cursor at the end of the text
      inputRef.current.selectionStart = inputRef.current.value.length
      inputRef.current.selectionEnd = inputRef.current.value.length
    }
  }, [autoFocus])

  const handleSave = () => {
    if (text.trim()) {
      onSave(task.id, text)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      onCancel()
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[60px] p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        placeholder="Task description..."
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-7 px-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cancel</span>
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleSave}
          className="h-7 px-2"
          disabled={!text.trim()}
        >
          <Check className="h-4 w-4" />
          <span className="sr-only">Save</span>
        </Button>
      </div>
    </div>
  )
}
