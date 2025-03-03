import { useState, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { TaskType } from "@/types/task"

export interface Idea {
  id: string
  text: string
  taskType: TaskType
  createdAt: number
  updatedAt: number
  connectedToPriority: boolean
}

export type NewIdea = Omit<Idea, "id" | "createdAt" | "updatedAt">

export function useIdeasManagement() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  
  // Use a ref to store the internal update function
  const internalFunctions = useRef({
    updateIdeaInternal: (id: string, updates: Partial<Idea>): boolean => {
      try {
        // Debug logging for idea updates
        console.log(`[DEBUG] updateIdeaInternal - Updating idea ${id} with:`, updates);
        
        setIdeas(prevIdeas => {
          const ideaIndex = prevIdeas.findIndex(idea => idea.id === id)
          if (ideaIndex === -1) {
            console.log(`[DEBUG] updateIdeaInternal - Idea ${id} not found`);
            return prevIdeas;
          }

          // Debug logging for the idea before update
          console.log(`[DEBUG] updateIdeaInternal - Idea ${id} before update:`, {
            id: prevIdeas[ideaIndex].id,
            text: prevIdeas[ideaIndex].text.substring(0, 20),
            taskType: prevIdeas[ideaIndex].taskType
          });

          const updatedIdeas = [...prevIdeas]
          updatedIdeas[ideaIndex] = {
            ...updatedIdeas[ideaIndex],
            ...updates,
            updatedAt: Date.now(),
          }
          
          // Debug logging for the idea after update
          console.log(`[DEBUG] updateIdeaInternal - Idea ${id} after update:`, {
            id: updatedIdeas[ideaIndex].id,
            text: updatedIdeas[ideaIndex].text.substring(0, 20),
            taskType: updatedIdeas[ideaIndex].taskType
          });

          return updatedIdeas
        })
        return true
      } catch (error) {
        console.error("[ERROR] Error updating idea:", error);
        return false;
      }
    }
  });

  // Set initial ideas
  const setInitialIdeas = useCallback((initialIdeas: Idea[]) => {
    try {
      console.log("[DEBUG] Setting initial ideas:", initialIdeas.length);
      // Sort ideas by creation date (newest first)
      const sortedIdeas = [...initialIdeas].sort((a, b) => b.createdAt - a.createdAt);
      setIdeas(sortedIdeas);
    } catch (error) {
      console.error("[ERROR] Error setting initial ideas:", error);
    }
  }, [])

  // Add a new idea
  const addIdea = useCallback((newIdea: NewIdea): Idea | null => {
    try {
      console.log("[DEBUG] Adding new idea:", newIdea.text.substring(0, 30));
      
      const idea: Idea = {
        id: uuidv4(),
        ...newIdea,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      setIdeas(prevIdeas => [idea, ...prevIdeas]); // Add to the beginning (newest first)
      console.log("[DEBUG] Successfully added idea:", idea.id);
      
      return idea;
    } catch (error) {
      console.error("[ERROR] Error adding idea:", error);
      return null;
    }
  }, [])

  // Update an idea (exposed function)
  const updateIdea = useCallback((id: string, updates: Partial<Idea>): boolean => {
    return internalFunctions.current.updateIdeaInternal(id, updates);
  }, []);

  // Delete an idea
  const deleteIdea = useCallback((id: string): boolean => {
    try {
      console.log("[DEBUG] Deleting idea:", id);
      let ideaExists = false;
      
      setIdeas(prevIdeas => {
        ideaExists = prevIdeas.some(idea => idea.id === id);
        return prevIdeas.filter(idea => idea.id !== id);
      });
      
      if (ideaExists) {
        console.log("[DEBUG] Successfully deleted idea:", id);
      } else {
        console.log("[DEBUG] Idea not found for deletion:", id);
      }
      
      return ideaExists;
    } catch (error) {
      console.error("[ERROR] Error deleting idea:", error);
      return false;
    }
  }, [])

  // Convert idea to task
  const convertIdeaToTask = useCallback((id: string): { text: string, taskType: TaskType } | null => {
    try {
      console.log("[DEBUG] Converting idea to task:", id);
      let ideaData: { ideaText: string, ideaType: TaskType } | null = null;
      
      setIdeas(prevIdeas => {
        const ideaIndex = prevIdeas.findIndex(idea => idea.id === id);
        if (ideaIndex === -1) {
          console.log("[DEBUG] Idea not found for conversion:", id);
          return prevIdeas;
        }
        
        // Store the idea data for return
        ideaData = {
          text: prevIdeas[ideaIndex].text,
          taskType: prevIdeas[ideaIndex].taskType
        };
        
        console.log("[DEBUG] Successfully converted idea to task:", id);
        
        // Remove the idea from the list
        return prevIdeas.filter(idea => idea.id !== id);
      });
      
      return ideaData;
    } catch (error) {
      console.error("[ERROR] Error converting idea to task:", error);
      return null;
    }
  }, []);

  return {
    ideas,
    addIdea,
    updateIdea,
    deleteIdea,
    convertIdeaToTask,
    setInitialIdeas
  }
}
