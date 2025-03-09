import { useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { UserSettings, TaskSettings } from "@/types/task";

// Default settings when data is loading
const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  showCompletedTasks: true,
  autoAnalyze: false,
  taskSettings: {
    endOfDayTime: "17:00",
    autoArchiveDelay: 7,
    gracePeriod: 24,
    retainRecurringTasks: true,
  },
};

export function useSettings() {
  const preferences = useQuery(api.userPreferences.getUserPreferences);
  const savePreferencesMutation = useMutation(api.userPreferences.saveUserPreferences);
  const deletePreferencesMutation = useMutation(api.userPreferences.deleteUserPreferences);

  const settings = preferences || DEFAULT_SETTINGS;

  const defaultTaskSettings: TaskSettings = {
    endOfDayTime: "17:00",
    autoArchiveDelay: 7,
    gracePeriod: 24,
    retainRecurringTasks: true,
  };

  const validateSettings = (settings: UserSettings) => {
    const { taskSettings = defaultTaskSettings, theme } = settings;

    // Check task settings
    if (!taskSettings.endOfDayTime) {
      throw new Error('End of day time is required');
    }
    if (typeof taskSettings.autoArchiveDelay !== 'number') {
      throw new Error('Auto-archive delay must be a number');
    }
    if (typeof taskSettings.gracePeriod !== 'number') {
      throw new Error('Grace period must be a number');
    }
    if (typeof taskSettings.retainRecurringTasks !== 'boolean') {
      throw new Error('Retain recurring tasks must be true or false');
    }

    // Check theme
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      throw new Error('Theme must be light, dark, or system');
    }
  };

  const updateSettings = useCallback(async (newSettings: UserSettings) => {
    try {
      console.log('Updating settings with:', newSettings);
      
      // Ensure taskSettings is present with defaults
      const settingsWithDefaults = {
        ...newSettings,
        taskSettings: {
          ...defaultTaskSettings,
          ...(newSettings.taskSettings || {})
        }
      };

      console.log('Settings with defaults:', settingsWithDefaults);
      validateSettings(settingsWithDefaults);
      
      // Add a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Settings validated, saving to Convex...');
      try {
        const result = await savePreferencesMutation(settingsWithDefaults);
        console.log('Convex mutation result:', result);
        if (!result) {
          throw new Error('No response from Convex mutation');
        }
        return { success: true };
      } catch (convexError) {
        console.error('Convex mutation error:', convexError);
        throw new Error(
          convexError instanceof Error 
            ? convexError.message 
            : 'Failed to save settings to database'
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings';
      console.error('Settings error:', { error, message, settings: newSettings });
      return { success: false, error: message };
    }
  }, [savePreferencesMutation]);

  const saveSettings = useCallback(async (partialSettings: Partial<UserSettings>) => {
    return updateSettings({ ...settings, ...partialSettings } as UserSettings);
  }, [settings, updateSettings]);

  const clearSettings = useCallback(async () => {
    try {
      await deletePreferencesMutation();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear settings';
      console.error('Settings error:', message);
      return { success: false, error: message };
    }
  }, [deletePreferencesMutation]);

  return { settings, updateSettings, saveSettings, clearSettings };
}
