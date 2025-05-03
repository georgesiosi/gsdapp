'use client'

import React, { useEffect, useState } from 'react'
import { useIdeasManagement } from '@/components/ideas/hooks/useIdeasManagement'
import { useTaskManagement } from '@/components/task/hooks/useTaskManagement'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { formatDistanceToNow } from 'date-fns'
import { Id } from '@/convex/_generated/dataModel'
import { TaskType, TaskOrIdeaType } from '@/types/task'

// Define a unified Idea type that handles both Convex and local formats
type ConvexIdea = {
  _id: Id<"ideas">;
  _creationTime: number;
  text: string;
  taskType: TaskOrIdeaType; // Using TaskOrIdeaType to handle both task and idea types
  userId: string;
  connectedToPriority: boolean;
}

type LocalIdea = {
  id: string;
  text: string;
  taskType: TaskOrIdeaType; // Using TaskOrIdeaType to handle both task and idea types
  userId: string;
  connectedToPriority: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// For the actual implementation, we need a more flexible type
type Idea = {
  id?: string;
  _id?: Id<"ideas">;
  _creationTime?: number;
  text: string;
  taskType: TaskOrIdeaType; // Using TaskOrIdeaType to handle both task and idea types
  userId: string;
  connectedToPriority: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Union type for ideas that could be from either source
type IdeaType = ConvexIdea | LocalIdea | Idea;

// Helper functions for type checking
const isConvexIdea = (idea: any): idea is ConvexIdea => {
  return '_id' in idea && idea._id !== undefined;
}

const isLocalIdea = (idea: any): idea is LocalIdea => {
  return 'id' in idea && idea.id !== undefined;
}

// Helper to ensure an idea has a proper TaskOrIdeaType
const ensureValidTaskType = (idea: any): idea is IdeaType => {
  // Make sure taskType is a valid TaskOrIdeaType
  if (typeof idea.taskType === 'string') {
    const validTypes = ['personal', 'work', 'business', 'idea'] as const;
    if (!validTypes.includes(idea.taskType as TaskOrIdeaType)) {
      // Convert any invalid string to 'idea' type
      idea.taskType = 'idea' as TaskOrIdeaType;
    }
  } else {
    // Default to 'idea' if taskType is missing or not a string
    idea.taskType = 'idea' as TaskOrIdeaType;
  }
  return true;
}

// Helper function to get a consistent ID
const getIdeaId = (idea: IdeaType): string => {
  // Ensure the idea has a valid taskType
  ensureValidTaskType(idea);
  
  if (isLocalIdea(idea)) return idea.id;
  if (isConvexIdea(idea)) return idea._id.toString();
  // Fallback for unexpected cases
  return (idea as Idea).id || ((idea as Idea)._id?.toString()) || 'unknown';
}

// Helper function to get a consistent date
const getCreationDate = (idea: IdeaType): Date => {
  // Ensure the idea has a valid taskType
  ensureValidTaskType(idea);
  
  if (isLocalIdea(idea) && idea.createdAt) return idea.createdAt;
  if (isConvexIdea(idea)) return new Date(idea._creationTime);
  // Handle mixed type
  const mixedIdea = idea as Idea;
  return mixedIdea.createdAt || (mixedIdea._creationTime ? new Date(mixedIdea._creationTime) : new Date());
}

export default function IdeasBankPage() {
  const { ideas: rawIdeas, setInitialIdeas, deleteIdea, convertIdeaToTask } = useIdeasManagement()
  // Cast ideas to IdeaType and ensure valid taskType
  const ideas = rawIdeas.map(idea => {
    const typedIdea = {
      ...idea,
      taskType: idea.taskType || 'idea'
    } as IdeaType;
    ensureValidTaskType(typedIdea);
    return typedIdea;
  })
  const { addTaskWithAIAnalysis } = useTaskManagement()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Load ideas from localStorage
    const loadIdeas = () => {
      try {
        const storedIdeas = localStorage.getItem('ideas')
        if (storedIdeas) {
          const parsedIdeas = JSON.parse(storedIdeas)
          console.log('[DEBUG] Raw ideas from localStorage:', parsedIdeas)
          
          // Convert string dates to numbers and ensure valid taskType
          const formattedIdeas = parsedIdeas.map((idea: any) => {
            const formattedIdea = {
              ...idea,
              createdAt: typeof idea.createdAt === 'string' ? 
                (isNaN(Number(idea.createdAt)) ? new Date(idea.createdAt).getTime() : Number(idea.createdAt)) : 
                idea.createdAt,
              updatedAt: typeof idea.updatedAt === 'string' ? 
                (isNaN(Number(idea.updatedAt)) ? new Date(idea.updatedAt).getTime() : Number(idea.updatedAt)) : 
                idea.updatedAt,
              taskType: idea.taskType || 'idea'
            } as IdeaType;
            
            ensureValidTaskType(formattedIdea);
            return formattedIdea;
          });
          
          console.log('[DEBUG] Formatted ideas:', formattedIdeas)
          setInitialIdeas(formattedIdeas)
        } else {
          console.log('[DEBUG] No ideas found in localStorage')
        }
      } catch (error) {
        console.error('Error loading ideas from localStorage:', error)
      } finally {
        setLoading(false)
      }
    }

    loadIdeas()
  }, [setInitialIdeas])

  // Save ideas to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('ideas', JSON.stringify(ideas))
        console.log('[DEBUG] Saved ideas to localStorage:', ideas.length)
      } catch (error) {
        console.error('Error saving ideas to localStorage:', error)
      }
    }
  }, [ideas, loading])

  const handleDeleteIdea = (id: string | Id<"ideas">) => {
    deleteIdea(id as any) // Cast to any to handle both string and Id<"ideas">
  }

  const handleConvertToTask = async (id: string | Id<"ideas">) => {
    const ideaData = convertIdeaToTask(id as any)
    if (ideaData) {
      try {
        console.log('[DEBUG] Converting idea with data:', ideaData)
        
        // Ensure taskType is one of the valid types recognized by the system
        let taskType: TaskType;
        
        // Check if taskType exists and set it appropriately
        if (typeof ideaData.taskType === 'string') {
          // Valid task types according to the application's type system
          const validTaskTypes: string[] = ['personal', 'work', 'business'];
          
          if (validTaskTypes.includes(ideaData.taskType)) {
            // It's a valid task type, use it
            taskType = ideaData.taskType as TaskType;
          } else {
            // Default to 'personal' if not a valid type
            taskType = 'personal';
          }
        } else {
          // Default to 'personal' if no taskType is provided
          taskType = 'personal';
        }
        
        // Convert the idea to a task
        try {
          console.log('[DEBUG] Attempting to convert idea to task:', ideaData);
          // Call addTaskWithAIAnalysis with just the text
          const { task: newTask, isAnalyzing } = await addTaskWithAIAnalysis(ideaData.text);
          
          if (newTask) {
            console.log('[DEBUG] Task created successfully:', newTask);
            
            // Show a toast notification
            const event = new CustomEvent('showToast', {
              detail: {
                message: 'Idea successfully converted to task',
                type: 'success'
              }
            })
            window.dispatchEvent(event)
            
            // Navigate back to the main page after a short delay to ensure the task is visible
            setTimeout(() => {
              router.push('/')
            }, 500)
          } else {
            throw new Error('Failed to create task')
          }
        } catch (error) {
          console.error('Error converting idea to task:', error)
          
          // Show error toast
          const event = new CustomEvent('showToast', {
            detail: {
              message: 'Failed to convert idea to task. Please try again.',
              type: 'error'
            }
          })
          window.dispatchEvent(event)
        }
      } catch (error) {
        console.error('Error converting idea to task:', error)
        
        // Show error toast
        const event = new CustomEvent('showToast', {
          detail: {
            message: 'Failed to convert idea to task. Please try again.',
            type: 'error'
          }
        })
        window.dispatchEvent(event)
      }
    }
  }

  const getTaskTypeLabel = (taskType: TaskOrIdeaType) => {
    switch (taskType) {
      case 'personal':
        return 'Personal'
      case 'work':
      case 'business':
        return 'Work/Business'
      case 'idea':
        return 'Idea'
      default:
        return 'Unknown'
    }
  }

  const getTaskTypeColor = (taskType: TaskOrIdeaType) => {
    switch (taskType) {
      case 'personal':
        return 'bg-purple-100 text-purple-800'
      case 'work':
      case 'business':
        return 'bg-primary/10 text-primary'
      case 'idea':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <button
          onClick={() => router.push('/')}
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold">Ideas Bank</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : ideas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No ideas yet. Ideas will appear here when you create tasks that are identified as ideas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Idea
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ideas.map((idea) => {
                return (
                  <tr key={getIdeaId(idea)} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-normal">
                      <div className="text-sm text-gray-900">{idea.text}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTaskTypeColor(idea.taskType)}`}>
                        {getTaskTypeLabel(idea.taskType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(getCreationDate(idea), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${idea.connectedToPriority ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {idea.connectedToPriority ? 'Priority-related' : 'General idea'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleConvertToTask(getIdeaId(idea))}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Convert to Task
                      </button>
                      <button
                        onClick={() => handleDeleteIdea(getIdeaId(idea))}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
