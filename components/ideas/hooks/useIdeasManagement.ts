import { useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Idea, TaskOrIdeaType } from "@/types/task";

export function useIdeasManagement() {
  const ideas = useQuery(api.ideas.getIdeas) || [];
  const addIdeaMutation = useMutation(api.ideas.addIdea);
  const updateIdeaMutation = useMutation(api.ideas.updateIdea);
  const deleteIdeaMutation = useMutation(api.ideas.deleteIdea);

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

  return {
    ideas,
    addIdea,
    updateIdea,
    deleteIdea,
  };
}
