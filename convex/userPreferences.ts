import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./auth";

// Get user preferences for the current user
export const getUserPreferences = query({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return preferences;
  },
});

// Define shared schema for theme and taskSettings
const themeSchema = v.union(v.literal('light'), v.literal('dark'), v.literal('system'));
const taskSettingsSchema = v.object({
  endOfDayTime: v.string(),
  autoArchiveDelay: v.float64(),
  gracePeriod: v.float64(),
  retainRecurringTasks: v.boolean(),
});

// Save or update user preferences
export const saveUserPreferences = mutation({
  args: {
    goal: v.optional(v.string()),
    openAIKey: v.optional(v.string()),
    licenseKey: v.optional(v.string()),
    priority: v.optional(v.string()),
    theme: v.optional(themeSchema),
    showCompletedTasks: v.optional(v.boolean()),
    autoAnalyze: v.optional(v.boolean()),
    syncApiKey: v.optional(v.boolean()),
    taskSettings: v.optional(taskSettingsSchema),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);

    // Get existing preferences
    const existingPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    console.log('------------------------------');
    console.log('[DEBUG] saveUserPreferences called with args:', {
      openAIKey: args.openAIKey ? `${args.openAIKey.substring(0, 5)}... (length: ${args.openAIKey.length})` : undefined,
      hasOpenAIKey: !!args.openAIKey,
      hasTaskSettings: !!args.taskSettings,
      theme: args.theme,
      otherArgsPresent: {
        goal: !!args.goal,
        licenseKey: !!args.licenseKey,
        priority: !!args.priority,
        showCompletedTasks: !!args.showCompletedTasks,
        autoAnalyze: !!args.autoAnalyze
      }
    });
    console.log('[DEBUG] Current userId:', userId);

    // Start with default task settings
    const defaultTaskSettings = {
      endOfDayTime: "17:00",
      autoArchiveDelay: 7,
      gracePeriod: 24,
      retainRecurringTasks: true,
    };

    // Ensure taskSettings exists with defaults
    const taskSettings = {
      ...defaultTaskSettings,
      ...(args.taskSettings || {})
    };

    // Validate taskSettings fields
    const { endOfDayTime, autoArchiveDelay, gracePeriod, retainRecurringTasks } = taskSettings;
    
    if (!endOfDayTime || typeof endOfDayTime !== 'string') {
      console.error('Invalid endOfDayTime:', endOfDayTime);
      throw new Error('endOfDayTime must be a valid time string');
    }
    
    if (typeof autoArchiveDelay !== 'number' || autoArchiveDelay < 1) {
      console.error('Invalid autoArchiveDelay:', autoArchiveDelay);
      throw new Error('autoArchiveDelay must be a positive number');
    }
    
    if (typeof gracePeriod !== 'number' || gracePeriod < 1) {
      console.error('Invalid gracePeriod:', gracePeriod);
      throw new Error('gracePeriod must be a positive number');
    }
    
    if (typeof retainRecurringTasks !== 'boolean') {
      console.error('Invalid retainRecurringTasks:', retainRecurringTasks);
      throw new Error('retainRecurringTasks must be true or false');
    }

    // Update args.taskSettings with validated values
    args.taskSettings = taskSettings;



    console.log('Checking for existing preferences...');
    if (existingPreferences) {
      console.log('Found existing preferences:', existingPreferences);
    } else {
      console.log('No existing preferences found');
    }

    // Create clean args by merging defaults with new args
    const cleanArgs = {
      goal: args.goal,
      openAIKey: args.syncApiKey ? args.openAIKey : undefined,  // Only store API key if sync is enabled
      licenseKey: args.licenseKey,
      priority: args.priority,
      theme: args.theme || 'system',  // Ensure theme is always set
      showCompletedTasks: args.showCompletedTasks ?? true,
      autoAnalyze: args.autoAnalyze ?? false,
      syncApiKey: args.syncApiKey ?? false,
      taskSettings: args.taskSettings ? {
        endOfDayTime: args.taskSettings.endOfDayTime,
        autoArchiveDelay: args.taskSettings.autoArchiveDelay,
        gracePeriod: args.taskSettings.gracePeriod,
        retainRecurringTasks: args.taskSettings.retainRecurringTasks
      } : defaultTaskSettings,
      userId
    };
    
    console.log('[DEBUG] Clean args prepared:', {
      hasOpenAIKey: !!cleanArgs.openAIKey,
      openAIKeyLength: cleanArgs.openAIKey?.length,
      openAIKeyPrefix: cleanArgs.openAIKey ? cleanArgs.openAIKey.substring(0, 5) + '...' : null,
      taskSettingsPresent: !!cleanArgs.taskSettings,
      userId: cleanArgs.userId
    });

    // Existing debug already replaced

    try {
      if (existingPreferences) {
        console.log('[DEBUG] Updating existing preferences with ID:', existingPreferences._id);
        console.log('[DEBUG] Before update - existing openAIKey:', 
          existingPreferences.openAIKey ? 
          `${existingPreferences.openAIKey.substring(0, 5)}... (length: ${existingPreferences.openAIKey.length})` : 
          'undefined');
          
        await ctx.db.patch(existingPreferences._id, cleanArgs);
        
        // Fetch the updated document
        const updatedPreferences = await ctx.db.get(existingPreferences._id);
        console.log('[DEBUG] After update - updated openAIKey:', 
          updatedPreferences && updatedPreferences.openAIKey ? 
          `${updatedPreferences.openAIKey.substring(0, 5)}... (length: ${updatedPreferences.openAIKey.length})` : 
          'undefined');
        console.log('[DEBUG] Full update result:', updatedPreferences ? JSON.stringify(updatedPreferences) : 'null');
        return updatedPreferences;
      } else {
        console.log('[DEBUG] Creating new preferences with openAIKey:', cleanArgs.openAIKey ? `length: ${cleanArgs.openAIKey.length}` : 'undefined');
        const result = await ctx.db.insert("userPreferences", cleanArgs);
        console.log('[DEBUG] Insert result ID:', result);
        
        // Fetch the inserted document to verify
        const insertedPreferences = await ctx.db.get(result);
        console.log('[DEBUG] Inserted preferences:', insertedPreferences ? {
          id: insertedPreferences._id,
          hasOpenAIKey: !!insertedPreferences.openAIKey,
          openAIKeyLength: insertedPreferences.openAIKey?.length,
          openAIKeyPrefix: insertedPreferences.openAIKey ? insertedPreferences.openAIKey.substring(0, 5) + '...' : null,
        } : 'null');
        
        return insertedPreferences;
      }
    } catch (error) {
      console.error('Error in saveUserPreferences:', error);
      throw error;
    }
  },
});

// Mark onboarding as complete for the current user
export const markOnboardingComplete = mutation({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);

    // Get existing preferences
    const existingPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingPreferences) {
      // Patch the document to set the flag
      await ctx.db.patch(existingPreferences._id, {
        hasCompletedOnboarding: true,
      });
      console.log(`[DEBUG] Marked onboarding complete for user: ${userId}`);
      return { success: true };
    } else {
      // This case should ideally not happen if a user exists and triggers this,
      // but logging it helps diagnose issues.
      console.warn(`[WARN] Tried to mark onboarding complete, but no preferences found for user: ${userId}`);
      // Optionally, create preferences here if needed, though typically they'd exist.
      // For now, just return failure or throw error
      return { success: false, error: "User preferences not found." };
      // throw new Error("User preferences not found."); 
    }
  },
});

// Delete user preferences
export const deleteUserPreferences = mutation({
  handler: async (ctx) => {
    const userId = await getAuthenticatedUser(ctx);
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (preferences) {
      await ctx.db.delete(preferences._id);
    }

    return { success: true };
  },
});
