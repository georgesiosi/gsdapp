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
    const data: SavedData = {
      goal: newGoal ?? savedGoal,
      priority: newPriority ?? savedPriority,
      completed: completed ?? isCompleted,
      lastModified: new Date().toISOString(),
    }
    localStorage.setItem("goalData", JSON.stringify(data))
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Focus & Priority</h2>
          </div>
          <div className="flex items-center gap-2">
            {savedGoal && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-1 ${isCompleted ? 'text-green-600' : ''}`}
                  onClick={toggleCompletion}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isCompleted ? 'Completed' : 'Mark Complete'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportGoalsToCSV()
                    toast({
                      title: "Goals Exported",
                      description: "Your goals have been exported to CSV",
                    })
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-[1fr,auto,1fr] md:gap-2 md:items-start">
          {/* Main Goal Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flag className="h-4 w-4 text-primary" />
                <h3 className="font-medium">I want to...</h3>
              </div>
              {savedGoal && !isEditingGoal && (
                <Button variant="ghost" size="sm" onClick={handleStartEditingGoal}>
                  <Pencil className="h-4 w-4 mr-2" />
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
                  className="text-lg"
                />
                <div className="flex gap-2">
                  <Button onClick={saveGoal} className="flex-1" size="lg">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Set This Goal
                  </Button>
                  {savedGoal && (
                    <Button variant="outline" onClick={handleCancelEditingGoal}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                <p className={`text-lg font-medium ${isCompleted ? 'text-muted-foreground line-through' : ''}`}>
                  {savedGoal}
                </p>
              </div>
            )}
          </div>

          {/* Visual Connection for Mobile */}
          <div className="flex justify-center md:hidden">
            <div className="flex flex-col items-center space-y-2 text-muted-foreground">
              <ArrowRight className="h-6 w-6 rotate-90 animate-bounce" />
              <span className="text-sm">Today's Priority</span>
            </div>
          </div>

          {/* Visual Connection for Desktop */}
          <div className="hidden md:flex md:items-center md:justify-center md:px-4 md:self-center">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <ArrowRight className="h-6 w-6 animate-bounce" />
              <span className="text-sm whitespace-nowrap">Today's Priority</span>
            </div>
          </div>

          {/* Daily Priority Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-medium">To achieve this, today I will...</h3>
              </div>
              {savedPriority && !isEditingPriority && (
                <Button variant="ghost" size="sm" onClick={handleStartEditingPriority}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Priority
                </Button>
              )}
            </div>

            {!savedPriority || isEditingPriority ? (
              <div className="space-y-2">
                <Input
                  placeholder="e.g., Complete the user authentication system"
                  value={tempPriority}
                  onChange={(e) => setTempPriority(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && savedGoal) {
                      savePriority()
                    }
                  }}
                  disabled={!savedGoal}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground italic">
                  Focus on one key task that moves you closer to your goal
                </p>
                <div className="flex gap-2">
                  <Button onClick={savePriority} className="flex-1" disabled={!savedGoal} size="lg">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Set Today's Priority
                  </Button>
                  {savedPriority && (
                    <Button variant="outline" onClick={handleCancelEditingPriority}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                <p className="text-lg font-medium">{savedPriority}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

