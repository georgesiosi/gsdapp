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

// Save or update user preferences
export const saveUserPreferences = mutation({
  args: {
    goal: v.optional(v.string()),
    openAIKey: v.optional(v.string()),
    licenseKey: v.optional(v.string()),
    priority: v.optional(v.string()),
    theme: v.optional(v.union(v.literal('light'), v.literal('dark'), v.literal('system'))),
    showCompletedTasks: v.optional(v.boolean()),
    autoAnalyze: v.optional(v.boolean()),
    taskSettings: v.optional(v.object({
      endOfDayTime: v.string(),
      autoArchiveDelay: v.number(),
      gracePeriod: v.number(),
      retainRecurringTasks: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUser(ctx);

    // Get existing preferences
    const existingPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    console.log('saveUserPreferences called with args:', args);
    console.log('Current userId:', userId);

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
      openAIKey: args.openAIKey,
      licenseKey: args.licenseKey,
      priority: args.priority,
      theme: args.theme,
      showCompletedTasks: args.showCompletedTasks,
      autoAnalyze: args.autoAnalyze,
      taskSettings: args.taskSettings,
      userId
    };

    console.log('Clean args prepared:', cleanArgs);

    try {
      if (existingPreferences) {
        console.log('Updating existing preferences with ID:', existingPreferences._id);
        const result = await ctx.db.patch(existingPreferences._id, cleanArgs);
        console.log('Update result:', result);
        return result;
      } else {
        console.log('Creating new preferences');
        const result = await ctx.db.insert("userPreferences", cleanArgs);
        console.log('Insert result:', result);
        return result;
      }
    } catch (error) {
      console.error('Error in saveUserPreferences:', error);
      throw error;
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
