import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Idea, TaskOrIdeaType } from "@/types/task";

export function useIdeasManagement() {
  const convexIdeas = useQuery(api.ideas.getIdeas) || [];
  const [localIdeas, setLocalIdeas] = useState<Idea[]>([]);
  
  // Use local ideas if they exist, otherwise use convex ideas
  const ideas = localIdeas.length > 0 ? localIdeas : convexIdeas;
  
  const addIdeaMutation = useMutation(api.ideas.addIdea);
  const updateIdeaMutation = useMutation(api.ideas.updateIdea);
  const deleteIdeaMutation = useMutation(api.ideas.deleteIdea);
  
  /**
   * Set initial ideas from localStorage during page load
   * This is used for backward compatibility with ideas stored in localStorage
   */
  const setInitialIdeas = useCallback((initialIdeas: Idea[]) => {
    if (Array.isArray(initialIdeas) && initialIdeas.length > 0) {
      console.log('[useIdeasManagement] Setting initial ideas:', initialIdeas.length);
      setLocalIdeas(initialIdeas);
    }
  }, []);

  const addIdea = useCallback(async (ideaData: {
    text: string;
    taskType: TaskOrIdeaType;
    connectedToPriority: boolean;
  }): Promise<Idea | null> => {
    try {
      const ideaId = await addIdeaMutation({
        text: ideaData.text,
        taskType: ideaData.taskType,
        connectedToPriority: ideaData.connectedToPriority,
      });

      // Return a temporary idea object while optimistic update is in progress
      return {
        id: ideaId,
        text: ideaData.text,
        taskType: ideaData.taskType,
        connectedToPriority: ideaData.connectedToPriority,
      } as Idea;
    } catch (error) {
      console.error("Error adding idea:", error);
      return null;
    }
  }, [addIdeaMutation]);

  const updateIdea = useCallback(async (id: Id<"ideas">, updates: Partial<Idea>) => {
    try {
      await updateIdeaMutation({
        id,
        text: updates.text,
        taskType: updates.taskType,
        connectedToPriority: updates.connectedToPriority,
      });
      return { success: true };
    } catch (error) {
      console.error("Error updating idea:", error);
      return { success: false, error: "Failed to update idea" };
    }
  }, [updateIdeaMutation]);

  const deleteIdea = useCallback(async (id: Id<"ideas">) => {
    try {
      await deleteIdeaMutation({
        id,
      });
      return { success: true };
    } catch (error) {
      console.error("Error deleting idea:", error);
      return { success: false, error: "Failed to delete idea" };
    }
  }, [deleteIdeaMutation]);
  
  /**
   * Convert an idea to a task and delete the idea
   * @param id The ID of the idea to convert
   * @returns The idea data to use for task creation or null if conversion failed
   */
  const convertIdeaToTask = useCallback((id: string | Id<"ideas">) => {
    try {
      // Find the idea in our current list
      // Handle both Convex ideas (_id) and local ideas (id)
      const idea = ideas.find(idea => {
        const ideaId = ('_id' in idea) ? idea._id : idea.id;
        return ideaId === id || ideaId?.toString() === id.toString();
      });
      
      if (!idea) {
        console.error("Cannot convert idea to task: Idea not found");
        return null;
      }
      
      // Delete the idea (optimistically assume it will succeed)
      // Handle both Convex ideas (_id) and local ideas (id)
      const ideaId = ('_id' in idea) ? idea._id : idea.id;
      deleteIdeaMutation({ id: ideaId as Id<"ideas"> }).catch(error => {
        console.error("Error deleting idea after conversion:", error);
      });
      
      // Get current timestamp for fallback
      const now = new Date().toISOString();
      
      // Return the idea data for task creation
      return {
        text: idea.text,
        taskType: idea.taskType || 'personal',
        // Use _creationTime as fallback if createdAt doesn't exist
        createdAt: ('createdAt' in idea) ? idea.createdAt : 
                  idea._creationTime ? new Date(idea._creationTime).toISOString() : now,
        updatedAt: ('updatedAt' in idea) ? idea.updatedAt : now
      };
    } catch (error) {
      console.error("Error converting idea to task:", error);
      return null;
    }
  }, [ideas, deleteIdeaMutation]);

  return {
    ideas,
    addIdea,
    updateIdea,
    deleteIdea,
    setInitialIdeas,
    convertIdeaToTask,
  };
}
