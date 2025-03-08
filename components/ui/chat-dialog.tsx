"use client"

import { memo, useCallback, useMemo, useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useSettings } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Task } from "@/types/task"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from 'uuid'
import * as Tooltip from '@radix-ui/react-tooltip'

// Generate a consistent reference number from task ID
function getTaskReference(taskId: string): string {
  // Take first 8 chars of UUID and convert to a number
  const shortId = taskId.slice(0, 8)
  // Convert to number (base 16) and take modulo to keep it reasonable
  const refNumber = parseInt(shortId, 16) % 1000
  // Ensure it's always 3 digits with leading zeros
  return refNumber.toString().padStart(3, '0')
}

// Task reference component with tooltip
const TaskReference = memo(function TaskReference({
  taskId,
  task,
}: {
  taskId: string
  task: Task
}) {
  const taskRef = getTaskReference(taskId)
  
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button 
            className="inline-flex items-center font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-help transition-colors px-1.5 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950"
            style={{ textDecoration: 'underline', textDecorationStyle: 'dotted' }}
          >
            T{taskRef}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="rounded-md bg-popover px-3 py-2 text-sm shadow-md border z-50"
            sideOffset={5}
          >
            <div className="grid gap-2 min-w-[200px]">
              <div className="font-medium break-words">{task.text}</div>
              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <div>Status:</div><div>{task.status}</div>
                <div>Quadrant:</div><div>{task.quadrant || 'unassigned'}</div>
                <div>Type:</div><div>{task.taskType || 'unspecified'}</div>
              </div>
            </div>
            <Tooltip.Arrow className="fill-popover" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
})

interface ChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tasks: ReadonlyArray<Task>
  userContext: string
}

type MessageRole = 'system' | 'user' | 'assistant'

interface Message {
  id: string
  role: MessageRole
  content: string
  displayContent?: string
}

type ChatError = {
  message: string
  code?: string
}

type TaskStatusCount = {
  [key: string]: number
  active: number
  completed: number
}

const MessageBubble = memo(function MessageBubble({ 
  message, 
  isCollapsed, 
  onToggleCollapse,
  tasks
}: { 
  message: Message
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  tasks: ReadonlyArray<Task>
}) {
  // Process message content to replace task IDs with numbered references
  const processedContent = useMemo(() => {
    if (message.role !== 'assistant') {
      return message.displayContent ?? message.content
    }

    const content = message.displayContent ?? message.content
    // Find all task references with their display format
    const parts = [];
    let lastIndex = 0;
    
    // Match TASK_id format, ignoring any additional formatting
    const regex = /TASK_([a-f0-9-]+)(?:\s*\([^)]*\))?/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      const taskId = match[1];
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        parts.push(<TaskReference key={`task-${taskId}-${match.index}`} taskId={taskId} task={task} />);
      } else {
        // Keep original text for unknown tasks
        parts.push(match[0]);
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return <>{parts}</>
  }, [message, tasks])

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        message.role === "user" ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "rounded-lg px-3 py-2 text-sm break-words",
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted",
          "max-w-[85%] whitespace-pre-wrap",
          message.role === "system" && "relative pr-8"
        )}
      >
        {message.role === "system" && isCollapsed !== undefined ? (
          <>
            {isCollapsed ? 
              (message.displayContent ?? message.content).split('\n')[0] : 
              (message.displayContent ?? message.content)
            }
            <button
              onClick={onToggleCollapse}
              className="absolute right-2 top-2 p-1 hover:bg-black/10 rounded"
              aria-label={isCollapsed ? "Expand message" : "Collapse message"}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </>
        ) : (
          processedContent
        )}
      </div>
    </div>
  )
})

function ChatDialogComponent({ open, onOpenChange, tasks, userContext }: ChatDialogProps) {
  const { settings, updateSettings } = useSettings()
  const [mounted, setMounted] = useState<boolean>(false)

  // Initialize OpenAI key from environment variable if not set
  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!settings.openAIKey && envKey) {
      updateSettings({ ...settings, openAIKey: envKey })
    }
  }, [settings, updateSettings])
  const [error, setError] = useState<ChatError | null>(null)
  const [isSystemMessageCollapsed, setIsSystemMessageCollapsed] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const abortController = useRef<AbortController | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const isFirstMount = useRef(true)

  // Task status counts used in systemMessage
  const taskStatusCounts = useMemo<TaskStatusCount>(() => {
    const counts = tasks.reduce<TaskStatusCount>((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    }, { active: 0, completed: 0 })
    return counts
  }, [tasks])

  // Memoize system context message
  const systemMessage = useMemo<Message>(() => {
    // Group tasks by status and type
    const tasksByStatus = tasks.reduce((acc, task) => {
      const status = task.status || 'unassigned';
      const type = task.taskType || 'unspecified';
      acc[status] = acc[status] || {};
      acc[status][type] = acc[status][type] || [];
      acc[status][type].push(task);
      return acc;
    }, {} as Record<string, Record<string, Task[]>>);

    // Create detailed task summary using taskStatusCounts for totals
    const taskSummary = Object.entries(tasksByStatus)
      .map(([status, typeGroups]) => {
        const typeDetails = Object.entries(typeGroups)
          .map(([type, tasks]) => `${type}: ${tasks.length}`)
          .join(', ');
        const totalForStatus = taskStatusCounts[status] || 0;
        return `${status} tasks (${typeDetails}, total: ${totalForStatus})`;
      })
      .join('\n');

    // Create the full context for the AI
    const fullContent = `You are a helpful AI assistant for a task management app. The user has the following context about their work and preferences: ${userContext}.

Current Task Overview:
${taskSummary}

You have access to real-time task data. Please provide specific, contextual responses based on the user's current tasks and their status.`;

    // Create a simplified display version
    const displayContent = `AI Assistant with access to:
• ${tasks.length} tasks (${Object.entries(tasksByStatus)
      .map(([status, types]) => 
        `${status}: ${Object.values(types).flat().length}`
      ).join(', ')})
• User preferences and context`;

    return {
      id: "system-1",
      role: "system",
      content: fullContent,
      displayContent: displayContent
    }
  }, [userContext, tasks, taskStatusCounts])

  // Keep track of previous system message for comparison
  const prevSystemMessageRef = useRef(systemMessage)

  // Initialize messages with system context and handle real-time updates
  useEffect(() => {
    const systemMessageChanged = prevSystemMessageRef.current !== systemMessage
    prevSystemMessageRef.current = systemMessage

    // Only update if it's first mount, no messages, or system message changed
    if (isFirstMount.current || messages.length === 0 || systemMessageChanged) {
      if (messages.length === 0) {
        setMessages([systemMessage])
      } else if (messages[0].role === 'system') {
        setMessages(prev => [systemMessage, ...prev.slice(1)])
      }
      isFirstMount.current = false
    }
  }, [systemMessage, messages, tasks, userContext])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer && messages.length > 0) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages])

  // Handle streaming chat response
  const processStream = async (response: Response) => {
    if (!response.ok) {
      console.error('Stream response not OK:', response.status, response.statusText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    if (!response.body) throw new Error('No response body')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: ''
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('Stream complete')
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        console.log('Received chunk:', chunk)
        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              console.log('Received [DONE] signal')
              break
            }

            try {
              const parsed = JSON.parse(data)
              console.log('Parsed data:', parsed)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                console.log('Content update:', content)
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: msg.content + content }
                    : msg
                ))
              }
            } catch (e) {
              console.error('Error parsing chunk:', e, '\nRaw data:', data)
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error)
      throw error
    } finally {
      reader.releaseLock()
    }
  }

  // Handle chat submission
  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      // Cancel any ongoing request
      if (abortController.current) {
        abortController.current.abort()
      }

      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: input.trim()
      }

      // Check for OpenAI API key
      if (!settings.openAIKey) {
        setError({
          message: 'OpenAI API key is required. Please add your API key in Settings.',
          code: 'NO_API_KEY'
        })
        return
      }

      setMessages(prev => [...prev, userMessage])
      setInput('')
      setError(null)
      setIsLoading(true)

      // Create new abort controller for this request
      abortController.current = new AbortController()

      try {
        console.log('Sending chat request:', {
          messageCount: messages.length + 1,
          lastMessage: userMessage.content,
          taskCount: tasks.length
        });

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'x-openai-key': settings.openAIKey || '',
            'x-license-key': settings.licenseKey || 'LEGACY_ACCESS' // Use LEGACY_ACCESS as fallback
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            tasks,
            userContext
          }),
          signal: abortController.current.signal
        })
        
        console.log('Received response:', {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        })

        await processStream(response)

        // Auto-collapse system message after first response
        if (!isSystemMessageCollapsed && messages.length === 1) {
          setIsSystemMessageCollapsed(true)
        }
      } catch (err) {
        console.error('Submit error:', err)
        if (err instanceof Error && err.name !== 'AbortError') {
          setError({
            message: 'Failed to send message. Please try again.',
            code: err.name
          })
        }
      } finally {
        setIsLoading(false)
        abortController.current = null
      }
    },
    [input, isLoading, messages, tasks, userContext, isSystemMessageCollapsed, settings]
  )

  // Handle initial mount and system message collapse
  useEffect(() => {
    if (!mounted) {
      setMounted(true)
    }
    // Auto-collapse system message after a delay
    const timer = setTimeout(() => {
      if (!isSystemMessageCollapsed && messages.length === 1) {
        setIsSystemMessageCollapsed(true)
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [mounted, messages.length, isSystemMessageCollapsed]);

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>AI Assistant</DialogTitle>
          <DialogDescription>
            Ask me anything about your tasks or productivity
          </DialogDescription>
        </DialogHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-6">
          <div className="space-y-6 max-w-full">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message}
                tasks={tasks}
                isCollapsed={message.role === 'system' ? isSystemMessageCollapsed : undefined}
                onToggleCollapse={message.role === 'system' ? () => setIsSystemMessageCollapsed(!isSystemMessageCollapsed) : undefined}
              />
            ))}
            {error && (
              <div className="text-sm text-red-500 text-center mt-4" role="alert">
                {error.message}
                {error.code && (
                  <span className="text-xs block mt-1 text-red-400">
                    Error code: {error.code}
                  </span>
                )}
              </div>
            )}
            {isLoading && (
              <div className="text-sm text-muted-foreground text-center mt-2">
                AI is thinking...
              </div>
            )}
          </div>
        </ScrollArea>

        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 border-t p-4"
        >
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            aria-label="Chat message"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={isLoading}
            aria-label="Send message"
          >
            Send
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const ChatDialog = memo(ChatDialogComponent)
