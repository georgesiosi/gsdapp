"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Target, Pencil, CheckCircle2, ChevronDown, ChevronUp, PlusCircle, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { FrontendGoal } from "@/types/goal"; 
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";

// Helper function to map Convex Goal to FrontendGoal (if needed elsewhere)
// For this component, we'll mostly use the raw Convex data directly
function mapGoal(convexGoal: any): FrontendGoal {
  return {
    ...convexGoal,
    id: convexGoal._id.toString(), 
  };
}

export function GoalSetter() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<Id<"goals"> | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<Id<"goals"> | null>(null); // For delete confirmation

  const activeGoalsData = useQuery(api.goals.getActiveGoals);

  const addGoal = useMutation(api.goals.addGoal);
  const updateGoal = useMutation(api.goals.updateGoal);
  const deleteGoalMutation = useMutation(api.goals.deleteGoal); // Add delete mutation

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("goalSectionCollapsed");
    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  const handleAddGoal = async () => {
    if (newGoalTitle.trim()) {
      try {
        await addGoal({ title: newGoalTitle });
        setNewGoalTitle("");
        setIsAddingGoal(false);
        toast({
          title: "Goal Added",
          description: `New goal '${newGoalTitle}' created successfully.`,
        });
      } catch (error) {
        console.error("Failed to add goal:", error);
        toast({
          title: "Error Adding Goal",
          description: (error instanceof Error ? error.message : "Could not add goal."),
          variant: "destructive",
        });
      }
    }
  };

  const handleEditClick = (goal: { _id: Id<"goals">, title: string }) => {
    setEditingGoalId(goal._id);
    setEditingTitle(goal.title);
  };

  const handleSaveEdit = async () => {
    if (editingGoalId && editingTitle.trim()) {
      try {
        await updateGoal({ id: editingGoalId, title: editingTitle });
        toast({
          title: "Goal Updated",
          description: `Goal title changed successfully.`,
        });
        setEditingGoalId(null);
      } catch (error) {
        console.error("Failed to update goal title:", error);
        toast({
          title: "Error Updating Goal",
          description: (error instanceof Error ? error.message : "Could not update goal."),
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleComplete = async (goal: { _id: Id<"goals">, status: 'active' | 'achieved' | 'archived' }) => {
    const newStatus = goal.status === 'active' ? 'achieved' : 'active';
    try {
      await updateGoal({ 
        id: goal._id, 
        status: newStatus,
      });
      toast({ description: `Goal marked as ${newStatus === 'achieved' ? 'achieved' : 'active'}.` });
    } catch (error) {
      console.error("Error updating goal status:", error);
      toast({ description: "Failed to update goal status.", variant: "destructive" });
    }
  };

  const handleDeleteGoal = async (id: Id<"goals">) => {
    try {
      await deleteGoalMutation({ id });
      toast({ description: "Goal deleted successfully." });
      setConfirmDeleteId(null); // Close confirmation
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({ description: "Failed to delete goal.", variant: "destructive" });
    }
  };

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("goalSectionCollapsed", JSON.stringify(newState));
  };

  const renderGoalItem = (goal: NonNullable<typeof activeGoalsData>[number]) => (
    <div key={goal._id.toString()} className="flex items-center justify-between p-3 bg-card rounded-lg shadow-sm border border-border mb-2">
      {editingGoalId === goal._id ? (
        // Editing View
        <div className="flex-grow flex items-center space-x-2 mr-2">
          <Input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
            className="text-sm h-8 border-indigo-500/20"
            placeholder="Enter goal title"
            autoFocus
          />
          <div className="flex justify-end gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleSaveEdit}
              className="h-7 text-xs"
            >
              Save
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setEditingGoalId(null)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        // Display View
        <>
          <div className="flex-grow flex items-center space-x-2 mr-2">
            <Target className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <span className={goal.status === 'achieved' ? 'line-through text-muted-foreground' : ''}> 
              {goal.title}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {/* Edit Button */} 
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleEditClick(goal)} 
              disabled={goal.status === 'achieved'} // Disable edit if achieved
              aria-label="Edit goal"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {/* Toggle Complete Button */} 
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleToggleComplete(goal)}
              aria-label={goal.status === 'active' ? "Mark as achieved" : "Mark as active"}
            >
              {goal.status === 'active' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
            </Button>
            {/* Delete Button */} 
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive/80"
              onClick={() => setConfirmDeleteId(goal._id)} 
              aria-label="Delete goal"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
      {/* Delete Confirmation */} 
      {confirmDeleteId === goal._id && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg p-2 z-50">
           <div className="flex flex-col items-center space-y-2">
             <p className="text-sm font-medium text-center">Delete this goal?</p>
             <div className="flex space-x-2">
               <Button size="sm" variant="destructive" onClick={() => handleDeleteGoal(goal._id)}>Confirm</Button>
               <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
             </div>
           </div>
         </div>
      )}
    </div>
  );

  return (
    <div className="border rounded-lg shadow-sm mb-6 bg-card text-card-foreground">
      <div className="flex justify-between items-center p-4 cursor-pointer" onClick={toggleCollapse}>
        <h2 className="text-lg font-semibold">Current Goals</h2>
        <div className="flex items-center space-x-1">
          {/* Add Goal Button */} 
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => setIsAddingGoal(prev => !prev)} 
            className="rounded-full"
            aria-label={isAddingGoal ? "Cancel adding goal" : "Add new goal"}
          >
            <PlusCircle className={`h-5 w-5 transition-transform duration-200 ${isAddingGoal ? 'rotate-45 text-destructive' : ''}`} />
          </Button>
          {/* Collapse/Expand Button */} 
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleCollapse}
            className="rounded-full"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Apply p-0 when collapsed, px-4 pb-4 when expanded */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 p-0' : 'max-h-[500px] px-4 pb-4'}`}>
        {/* Restored pt-4, border-t remains removed */}
        <div className="pt-4">
          {activeGoalsData && activeGoalsData.length > 0 ? (
            <div className="space-y-2">
              {activeGoalsData.map(renderGoalItem)}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No active goals. Add one below!
            </div>
          )}
          {/* Add New Goal Input (Collapsible) */} 
          {isAddingGoal && (
            <div className="flex items-center space-x-2 border-t border-border">
              <Target className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <Input
                type="text"
                placeholder="Enter new goal title..."
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddGoal(); }}
                className="flex-grow"
                autoFocus
              />
              <Button onClick={handleAddGoal} size="sm">Add Goal</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
