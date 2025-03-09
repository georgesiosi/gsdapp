"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { Task, Idea, UserSettings } from "@/types/task";

const STORAGE_KEYS = {
  TASKS: "tasks",
  IDEAS: "ideas",
  SETTINGS: "settings",
  MIGRATION_COMPLETED: "convex_migration_completed",
  MIGRATION_IN_PROGRESS: "convex_migration_in_progress",
} as const;

type StorageData = {
  tasks?: Task[];
  ideas?: Idea[];
  settings?: UserSettings;
};

export function useDataMigration() {
  const { userId } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [needsMigration, setNeedsMigration] = useState(false);

  const addTaskMutation = useMutation(api.tasks.addTask);
  const addIdeaMutation = useMutation(api.ideas.addIdea);
  const savePreferencesMutation = useMutation(api.userPreferences.saveUserPreferences);

  const loadStorageData = (): StorageData => {
    const data: StorageData = {};
    try {
      const tasksJson = localStorage.getItem(STORAGE_KEYS.TASKS);
      const ideasJson = localStorage.getItem(STORAGE_KEYS.IDEAS);
      const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (tasksJson) data.tasks = JSON.parse(tasksJson);
      if (ideasJson) data.ideas = JSON.parse(ideasJson);
      if (settingsJson) data.settings = JSON.parse(settingsJson);
    } catch (error) {
      throw new Error(`Failed to load storage data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return data;
  };

  const migrateData = useCallback(async () => {
    if (!userId) return;

    const migrationCompleted = localStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETED);
    const migrationInProgress = localStorage.getItem(STORAGE_KEYS.MIGRATION_IN_PROGRESS);
    
    if (migrationCompleted || migrationInProgress) return;

    try {
      setIsMigrating(true);
      setProgress(0);
      localStorage.setItem(STORAGE_KEYS.MIGRATION_IN_PROGRESS, 'true');

      const data = loadStorageData();
      const totalItems = (data.tasks?.length ?? 0) + (data.ideas?.length ?? 0) + (data.settings ? 1 : 0);
      let completedItems = 0;

      if (data.tasks?.length) {
        for (const task of data.tasks) {
          await addTaskMutation({
            text: task.text,
            quadrant: task.quadrant,
            taskType: task.taskType,
            needsReflection: task.needsReflection ?? false,
            status: task.status ?? "active",
            description: task.description,
            ...(task.reflection && { reflection: task.reflection })
          });
          completedItems++;
          setProgress(Math.floor((completedItems / totalItems) * 100));
        }
      }

      if (data.ideas?.length) {
        for (const idea of data.ideas) {
          await addIdeaMutation({
            text: idea.text,
            taskType: idea.taskType,
            connectedToPriority: idea.connectedToPriority,
          });
          completedItems++;
          setProgress(Math.floor((completedItems / totalItems) * 100));
        }
      }

      if (data.settings) {
        await savePreferencesMutation({
          goal: data.settings.goal,
          openAIKey: data.settings.openAIKey,
          licenseKey: data.settings.licenseKey,
          priority: data.settings.priority,
          theme: data.settings.theme,
          showCompletedTasks: data.settings.showCompletedTasks,
          autoAnalyze: data.settings.autoAnalyze,
          taskSettings: data.settings.taskSettings,
        });
        completedItems++;
        setProgress(100);
      }

      localStorage.setItem(STORAGE_KEYS.MIGRATION_COMPLETED, 'true');
      localStorage.removeItem(STORAGE_KEYS.MIGRATION_IN_PROGRESS);
      setNeedsMigration(false);

    } catch (error) {
      localStorage.removeItem(STORAGE_KEYS.MIGRATION_IN_PROGRESS);
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMigrating(false);
    }
  }, [userId, addTaskMutation, addIdeaMutation, savePreferencesMutation]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;

    const hasExistingData = Object.values(STORAGE_KEYS)
      .filter(key => key !== STORAGE_KEYS.MIGRATION_COMPLETED && key !== STORAGE_KEYS.MIGRATION_IN_PROGRESS)
      .some(key => localStorage.getItem(key) !== null);

    const migrationCompleted = localStorage.getItem(STORAGE_KEYS.MIGRATION_COMPLETED);
    const migrationInProgress = localStorage.getItem(STORAGE_KEYS.MIGRATION_IN_PROGRESS);
    
    setNeedsMigration(hasExistingData && !migrationCompleted && !migrationInProgress);
  }, [userId]);

  return { migrateData, isMigrating, progress, needsMigration };
}
