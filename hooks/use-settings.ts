import { useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { UserSettings, TaskSettings, ConvexUserPreferences } from "@/types/task";

// Default settings when data is loading
const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  showCompletedTasks: true,
  autoAnalyze: false,
  syncApiKey: false,  // Default to not syncing API key to cloud
  taskSettings: {
    endOfDayTime: "17:00",
    autoArchiveDelay: 7,
    gracePeriod: 24,
    retainRecurringTasks: true,
  },
};

export function useSettings() {
  const preferences = useQuery(api.userPreferences.getUserPreferences) as ConvexUserPreferences | null;
  const savePreferencesMutation = useMutation(api.userPreferences.saveUserPreferences);
  const deletePreferencesMutation = useMutation(api.userPreferences.deleteUserPreferences);

  // Enhance settings with data from localStorage if needed
  const settings = useCallback(() => {
    // Convert Convex preferences to UserSettings format
    const baseSettings = preferences ? {
      ...preferences,
      theme: preferences.theme as UserSettings['theme'],  // Cast string to union type
    } : DEFAULT_SETTINGS;
    let finalSettings = { ...baseSettings } as UserSettings;
    
    // Priority for API key: 
    // 1. environment variables (always highest priority)
    // 2. localStorage (for local-only storage)
    // 3. cloud preferences (only if sync is enabled)
    
    // 1. Check environment variables first
    const envKey = process.env.OPENAI_API_KEY;
    
    if (envKey) {
      console.log('[DEBUG-SETTINGS] Found API key in environment variables');
      finalSettings.openAIKey = envKey;
      
      // Sync to localStorage
      if (typeof window !== 'undefined') {
        console.log('[DEBUG-SETTINGS] Syncing environment key to localStorage');
        localStorage.setItem('openai-api-key', envKey);
      }
      return finalSettings;
    }
    
    // 2. Check localStorage
    if (typeof window !== 'undefined') {
      const storedApiKey = localStorage.getItem('openai-api-key');
      if (storedApiKey?.startsWith('sk-')) {
        console.log('[DEBUG-SETTINGS] Using API key from localStorage');
        // Only sync to cloud if enabled
        if (baseSettings.syncApiKey) {
          finalSettings.openAIKey = storedApiKey;
        }
        return finalSettings;
      }
    }
    
    // 3. Finally, check cloud preferences if sync is enabled
    if (baseSettings.syncApiKey && baseSettings.openAIKey?.startsWith('sk-')) {
      console.log('[DEBUG-SETTINGS] Using API key from cloud preferences');
      
      // Sync to localStorage
      if (typeof window !== 'undefined') {
        console.log('[DEBUG-SETTINGS] Syncing cloud key to localStorage');
        localStorage.setItem('openai-api-key', baseSettings.openAIKey);
      }
    } else {
      console.log('[DEBUG-SETTINGS] No valid API key found from allowed sources');
      // Clear any invalid keys
      if (typeof window !== 'undefined') {
        localStorage.removeItem('openai-api-key');
      }
    }
    
    return finalSettings;
  }, [preferences])();

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
      console.log('[DEBUG-SETTINGS] Updating settings with:', {
        hasOpenAIKey: !!newSettings.openAIKey,
        openAIKeyLength: newSettings.openAIKey?.length,
        hasTaskSettings: !!newSettings.taskSettings,
        syncApiKey: newSettings.syncApiKey
      });
      
      // Create clean settings object without Convex metadata
      const settingsWithDefaults: UserSettings = {
        goal: newSettings.goal,
        openAIKey: newSettings.openAIKey,
        licenseKey: newSettings.licenseKey,
        priority: newSettings.priority,
        theme: newSettings.theme || 'system',
        showCompletedTasks: newSettings.showCompletedTasks ?? true,
        autoAnalyze: newSettings.autoAnalyze ?? false,
        syncApiKey: newSettings.syncApiKey ?? false,
        taskSettings: {
          endOfDayTime: newSettings.taskSettings?.endOfDayTime || defaultTaskSettings.endOfDayTime,
          autoArchiveDelay: newSettings.taskSettings?.autoArchiveDelay || defaultTaskSettings.autoArchiveDelay,
          gracePeriod: newSettings.taskSettings?.gracePeriod || defaultTaskSettings.gracePeriod,
          retainRecurringTasks: newSettings.taskSettings?.retainRecurringTasks ?? defaultTaskSettings.retainRecurringTasks
        }
      };

      console.log('[DEBUG-SETTINGS] Settings with defaults prepared');
      validateSettings(settingsWithDefaults);
      
      // Handle API key updates
      const envKey = process.env.OPENAI_API_KEY;
      if (envKey) {
        // Environment key takes precedence
        console.log('[DEBUG-SETTINGS] Using environment API key');
        settingsWithDefaults.openAIKey = envKey;
        if (typeof window !== 'undefined') {
          localStorage.setItem('openai-api-key', envKey);
        }
      } else if (settingsWithDefaults.openAIKey?.startsWith('sk-')) {
        console.log('[DEBUG-SETTINGS] Handling provided API key');
        
        // Always save valid keys to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('openai-api-key', settingsWithDefaults.openAIKey);
        }
        
        // Only save to cloud if sync is enabled
        if (!settingsWithDefaults.syncApiKey) {
          console.log('[DEBUG-SETTINGS] Cloud sync disabled, removing key from cloud');
          settingsWithDefaults.openAIKey = undefined;
        }
      } else {
        // Invalid or no key provided
        console.log('[DEBUG-SETTINGS] No valid API key provided');
        settingsWithDefaults.openAIKey = undefined;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('openai-api-key');
        }
      }
      
      console.log('[DEBUG-SETTINGS] Settings validated, saving to Convex...');
      
      // Implement retry logic for Convex mutations
      let result;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          result = await savePreferencesMutation(settingsWithDefaults);
          console.log('[DEBUG-SETTINGS] Convex mutation success on attempt', retryCount + 1);
          break; // Exit loop if successful
        } catch (retryError) {
          retryCount++;
          console.error(`[DEBUG-SETTINGS] Convex mutation attempt ${retryCount} failed:`, retryError);
          
          if (retryCount > maxRetries) {
            throw retryError; // Rethrow if we've exhausted retries
          }
          
          // Wait longer between retries
          await new Promise(resolve => setTimeout(resolve, retryCount * 300));
        }
      }
      
      console.log('[DEBUG-SETTINGS] Convex mutation result:', result);
      
      // Verify the result contains what we expect
      if (!result || typeof result !== 'object') {
        console.error('[DEBUG-SETTINGS] Invalid response from Convex mutation');
        throw new Error('Invalid response from Convex mutation');
      }

      // Double-check the result contains our API key
      if (settingsWithDefaults.openAIKey && !result.openAIKey) {
        console.error('[DEBUG-SETTINGS] API key missing from Convex response!');
      }

      // Double-check localStorage has the key
      if (settingsWithDefaults.openAIKey && typeof window !== 'undefined') {
        const storedKey = localStorage.getItem('openai-api-key');
        if (!storedKey) {
          console.warn('[DEBUG-SETTINGS] API key missing from localStorage after save! Re-saving...');
          localStorage.setItem('openai-api-key', settingsWithDefaults.openAIKey);
        }
      }

      return { success: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings';
      console.error('[DEBUG-SETTINGS] Settings error:', { 
        errorMessage: message,
        hasOpenAIKey: !!newSettings.openAIKey,
        openAIKeyLength: newSettings.openAIKey?.length
      });
      
      // Even if Convex fails, ensure the key is in localStorage
      if (newSettings.openAIKey && typeof window !== 'undefined') {
        console.log('[DEBUG-SETTINGS] Saving key to localStorage despite Convex error');
        localStorage.setItem('openai-api-key', newSettings.openAIKey);
      }
      
      return { success: false, error: message };
    }
  }, [savePreferencesMutation]);

  const saveSettings = useCallback(async (partialSettings: Partial<UserSettings>) => {
    console.log('[DEBUG-SETTINGS] Saving partial settings:', {
      hasOpenAIKey: !!partialSettings.openAIKey,
      openAIKeyLength: partialSettings.openAIKey?.length,
    });
    
    // Special handling for OpenAI key - save to localStorage immediately
    if (partialSettings.openAIKey && typeof window !== 'undefined') {
      console.log('[DEBUG-SETTINGS] Immediately saving API key to localStorage');
      localStorage.setItem('openai-api-key', partialSettings.openAIKey);
    }
    
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
