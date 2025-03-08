"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Target, Flag, Calendar, Pencil, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface SavedData {
  goal: string
  priority: string
  completed: boolean
  lastModified: string
}

export function GoalSetter() {
  const [savedGoal, setSavedGoal] = useState("")
  const [savedPriority, setSavedPriority] = useState("")
  const [tempGoal, setTempGoal] = useState("")
  const [tempPriority, setTempPriority] = useState("")
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [isEditingPriority, setIsEditingPriority] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { toast } = useToast()

  // Load saved data and preferences on mount
  useEffect(() => {
    // Load collapse state
    const savedCollapsed = localStorage.getItem("goalSectionCollapsed")
    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed))
    }
    try {
      const savedData = localStorage.getItem("goalData")
      if (savedData) {
        const { goal, priority, completed } = JSON.parse(savedData) as SavedData
        
        if (goal) {
          setSavedGoal(goal)
          setTempGoal(goal)
        }
        
        if (priority) {
          setSavedPriority(priority)
          setTempPriority(priority)
        }

        setIsCompleted(completed || false)
      }
    } catch (error) {
      console.error("Error loading saved data:", error)
      toast({
        title: "Error",
        description: "Failed to load saved data",
        variant: "destructive",
      })
    }
  }, [toast])

  // Save all data to localStorage
  const saveData = (newGoal?: string, newPriority?: string, completed?: boolean) => {
    const goal = newGoal ?? savedGoal;
    const priority = newPriority ?? savedPriority;
    
    const data: SavedData = {
      goal,
      priority,
      completed: completed ?? isCompleted,
      lastModified: new Date().toISOString(),
    }
    
    // Save the combined data
    localStorage.setItem("goalData", JSON.stringify(data))
    
    // Also save individual items for API access
    localStorage.setItem("savedGoal", goal)
    localStorage.setItem("savedPriority", priority)
  }

  const handleStartEditingGoal = () => {
    setTempGoal(savedGoal)
    setIsEditingGoal(true)
  }

  const handleCancelEditingGoal = () => {
    setTempGoal(savedGoal)
    setIsEditingGoal(false)
  }

  const handleStartEditingPriority = () => {
    setTempPriority(savedPriority)
    setIsEditingPriority(true)
  }

  const handleCancelEditingPriority = () => {
    setTempPriority(savedPriority)
    setIsEditingPriority(false)
  }

  const saveGoal = () => {
    if (!tempGoal.trim()) {
      toast({
        title: "Goal Required",
        description: "Please enter your goal",
        variant: "destructive",
      })
      return
    }

    setSavedGoal(tempGoal)
    saveData(tempGoal)
    setIsEditingGoal(false)
    toast({
      title: "Goal Saved",
      description: "Your main goal has been updated",
    })
  }

  const savePriority = () => {
    if (!tempPriority.trim()) {
      toast({
        title: "Priority Required",
        description: "Please enter today's priority",
        variant: "destructive",
      })
      return
    }

    setSavedPriority(tempPriority)
    saveData(undefined, tempPriority)
    setIsEditingPriority(false)
    toast({
      title: "Priority Saved",
      description: "Your daily priority has been updated",
    })
  }

  const toggleCompletion = () => {
    const newCompleted = !isCompleted
    setIsCompleted(newCompleted)
    saveData(undefined, undefined, newCompleted)
    toast({
      title: newCompleted ? "Goal Completed" : "Goal Reopened",
      description: newCompleted ? "Congratulations!" : "Keep working towards your goal!",
    })
  }

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("goalSectionCollapsed", JSON.stringify(newState))
  }

  return (
    <div className="goal-setter-container border rounded-lg overflow-hidden relative" style={{ zIndex: 20 }}>
      <div 
        className="goal-setter-header flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Focus & Priority</h3>
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>

      <div 
        className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'} overflow-hidden`}
      >
        <div className="space-y-8 p-3 relative">
          {/* Main Goal Section */}
          <div className="relative group rounded-lg border bg-blue-50/30 border-blue-100 p-3 transition-all duration-200 mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Flag className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-blue-600">Main Goal</span>
              {isCompleted && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                  Done
                </span>
              )}
            </div>

            {isEditingGoal ? (
              <div className="space-y-2">
                <Input
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveGoal()}
                  className="text-sm h-8 border-blue-200"
                  placeholder="Enter your main goal"
                  autoFocus
                />
                <div className="flex justify-end gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleCancelEditingGoal}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={saveGoal}
                    className="h-7 text-xs"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group-hover:pr-16 relative">
                <p className="text-sm text-gray-800 mb-2">{savedGoal || "Set your main goal"}</p>
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-md px-1.5 py-1 shadow-sm" style={{ zIndex: 30 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartEditingGoal}
                    className="h-7 w-7 p-0 relative z-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCompletion}
                    className={`h-7 w-7 p-0 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Daily Priority Section */}
          <div className="relative group rounded-lg border bg-amber-50/30 border-amber-100 p-3 transition-all duration-200 mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">Today's Priority</span>
            </div>

            {isEditingPriority ? (
              <div className="space-y-2">
                <Input
                  value={tempPriority}
                  onChange={(e) => setTempPriority(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && savePriority()}
                  className="text-sm h-8 border-amber-200"
                  placeholder="Enter today's priority"
                  autoFocus
                />
                <div className="flex justify-end gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleCancelEditingPriority}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={savePriority}
                    className="h-7 text-xs"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group-hover:pr-16 relative">
                <p className="text-sm text-gray-800 mb-2">{savedPriority || "Set your daily priority"}</p>
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-md px-1.5 py-1 shadow-sm" style={{ zIndex: 30 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartEditingPriority}
                    className="h-7 w-7 p-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCompletion}
                    className={`h-7 w-7 p-0 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
