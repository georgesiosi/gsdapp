"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Target, Flag, Calendar, Pencil, CheckCircle2, ArrowRight, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { exportGoalsToCSV } from "@/lib/export-utils"

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
  const { toast } = useToast()

  // Load saved data on mount
  useEffect(() => {
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

  const handleExportGoals = () => {
    exportGoalsToCSV()
    toast({
      title: "Goals Exported",
      description: "Your goals have been exported to CSV",
    })
  }

  return (
    <div className="goal-setter-container">
      <div className="goal-setter-header">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Focus & Priority</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleCompletion}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Mark Complete
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleExportGoals} 
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
      <div className="goal-setter-content">
        <div className="grid grid-cols-2 gap-4">
          {/* Main Goal Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">I want to...</span>
              </div>
              {savedGoal && !isEditingGoal && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleStartEditingGoal} 
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit Goal
                </Button>
              )}
            </div>

            {!savedGoal || isEditingGoal ? (
              <div className="space-y-2">
                <Input
                  placeholder="e.g., Launch my startup's MVP by next month"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      saveGoal()
                    }
                  }}
                  className="text-sm bg-gray-50"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={saveGoal} 
                    className="flex-1 text-xs bg-gray-900 hover:bg-gray-800"
                  >
                    Set Goal
                  </Button>
                  {savedGoal && (
                    <Button 
                      variant="outline" 
                      onClick={handleCancelEditingGoal} 
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {savedGoal}
                </p>
              </div>
            )}
          </div>

          {/* Today's Priority Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">To achieve this, today I will...</span>
              </div>
              {savedPriority && !isEditingPriority && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleStartEditingPriority} 
                  className="text-xs text-gray-500 hover:text-gray-900"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit Priority
                </Button>
              )}
            </div>

            {!savedPriority || isEditingPriority ? (
              <div className="space-y-2">
                <Input
                  placeholder="e.g., Complete the landing page design"
                  value={tempPriority}
                  onChange={(e) => setTempPriority(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      savePriority()
                    }
                  }}
                  className="text-sm bg-gray-50"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={savePriority} 
                    className="flex-1 text-xs bg-gray-900 hover:bg-gray-800"
                  >
                    Set Priority
                  </Button>
                  {savedPriority && (
                    <Button 
                      variant="outline" 
                      onClick={handleCancelEditingPriority} 
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">{savedPriority}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
