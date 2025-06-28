"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { useProfile } from '@/hooks/use-profile'
import useLocalStorage from '@/hooks/useLocalStorage';
import { useUser } from '@clerk/nextjs'
import { TaskSettings, UserSettings } from '@/types/task'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Download, History } from 'lucide-react'
import Link from 'next/link'
import { SettingsNav } from '@/components/settings/settings-nav'
import { recoverFromBackup } from '@/lib/storage'
import { SubscriptionDetails } from '@/components/settings/subscription-details';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageIntro } from '@/components/page-intro';
import { ErrorTest } from '@/components/error-test';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings() as { settings: UserSettings, updateSettings: (newSettings: Partial<UserSettings>) => Promise<any> }
  const { profile, setProfile } = useProfile()
  const { user, isLoaded, isSignedIn } = useUser();
  const [localPersonalContext, setLocalPersonalContext] = useState('')
  const { toast } = useToast()
  const [isTaskSettingsSaving, setIsTaskSettingsSaving] = useState(false)
  const [isApiKeySaving, setIsApiKeySaving] = useState(false)
  const [isEditingKey, setIsEditingKey] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')
  const [mounted, setMounted] = useState(false)
  const [localKey, setLocalKey] = useState('')
  const [taskSettingsSaveSuccess, setTaskSettingsSaveSuccess] = useState(false)
  const [apiKeySaveSuccess, setApiKeySaveSuccess] = useState(false)
  const [isProfileSaving, setIsProfileSaving] = useState(false)

  const [showSidebars, setShowSidebars] = useLocalStorage<boolean>('showEisenhowerSidebars', true);
  const [showGoalsSection, setShowGoalsSection] = useLocalStorage<boolean>('showGoalsSection', true);

  const defaultTaskSettings: TaskSettings = useMemo(() => ({
    autoPrioritize: true,
    endOfDayTime: '23:59',
    autoArchiveDelay: 7,
    gracePeriod: 30,
    retainRecurringTasks: true,
  }), [])

  const [taskSettings, setTaskSettings] = useState<TaskSettings>(
    settings.taskSettings ?? defaultTaskSettings
  )

  useEffect(() => {
    setMounted(true)
    // Initialize local personal context from profile if available
    if (profile?.personalContext) {
      setLocalPersonalContext(profile.personalContext)
    }
  }, [profile])

  // Handle API key initialization and updates
  useEffect(() => {
    if (!mounted) return;

    // Check environment variable first
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) {
      console.log('[DEBUG-SETTINGS] Using environment API key');
      setLocalKey(envKey);
      localStorage.setItem('openai-api-key', envKey);
      return;
    }

    // Try to load API key from localStorage
    const storedKey = localStorage.getItem('openai-api-key')
    if (storedKey && storedKey.startsWith('sk-')) {
      console.log('[DEBUG-SETTINGS] Using API key from localStorage')
      setLocalKey(storedKey)
    } else if (settings.openAIKey && settings.openAIKey.startsWith('sk-')) {
      // If not in localStorage but in settings, set both
      setLocalKey(settings.openAIKey)
      localStorage.setItem('openai-api-key', settings.openAIKey)
      console.log('[DEBUG-SETTINGS] Synced API key from settings to localStorage')
    } else {
      // Clear invalid keys
      setLocalKey('')
      localStorage.removeItem('openai-api-key')
      console.log('[DEBUG-SETTINGS] Cleared invalid API key')
    }
  }, [mounted, settings.openAIKey])

  useEffect(() => {
    setTaskSettings(settings.taskSettings ?? defaultTaskSettings);
  }, [settings.taskSettings, defaultTaskSettings]);

  const handleSave = async () => {
    if (isTaskSettingsSaving) {
      console.log('[DEBUG-SETTINGS] Task settings save already in progress')
      return
    }

    console.log('[DEBUG-SETTINGS] Starting task settings save...')
    setIsTaskSettingsSaving(true)
    
    try {
      // Validate taskSettings before saving
      console.log('[DEBUG-SETTINGS] Validating taskSettings:', taskSettings)
      console.log('[DEBUG-SETTINGS] Validation checks:', {
        endOfDayTime: taskSettings.endOfDayTime,
        endOfDayTimeValid: !!taskSettings.endOfDayTime,
        autoArchiveDelay: taskSettings.autoArchiveDelay,
        autoArchiveDelayType: typeof taskSettings.autoArchiveDelay,
        gracePeriod: taskSettings.gracePeriod,
        gracePeriodType: typeof taskSettings.gracePeriod,
        retainRecurringTasks: taskSettings.retainRecurringTasks,
        retainRecurringTasksType: typeof taskSettings.retainRecurringTasks,
        autoPrioritize: taskSettings.autoPrioritize,
        autoPrioritizeType: typeof taskSettings.autoPrioritize
      })
      
      if (!taskSettings.endOfDayTime || 
          typeof taskSettings.autoArchiveDelay !== 'number' || 
          typeof taskSettings.gracePeriod !== 'number' || 
          typeof taskSettings.retainRecurringTasks !== 'boolean' || 
          typeof taskSettings.autoPrioritize !== 'boolean') {
        throw new Error('Invalid task settings')
      }

      console.log('[DEBUG-SETTINGS] Creating settings object with:', { taskSettings })
      // Filter out Convex metadata fields and only include valid UserSettings fields
      const updatedSettings: UserSettings = {
        goal: settings.goal,
        openAIKey: localKey || settings.openAIKey,
        priority: settings.priority,
        theme: settings.theme as 'light' | 'dark' | 'system',
        autoSave: settings.autoSave ?? true,
        defaultDueDate: settings.defaultDueDate ?? 'none',
        showCompletedTasks: settings.showCompletedTasks ?? true,
        taskSortOrder: settings.taskSortOrder ?? 'dueDate',
        autoAnalyze: settings.autoAnalyze ?? false,
        syncApiKey: settings.syncApiKey ?? false,
        taskSettings: {
          autoPrioritize: taskSettings.autoPrioritize,
          endOfDayTime: taskSettings.endOfDayTime,
          autoArchiveDelay: taskSettings.autoArchiveDelay,
          gracePeriod: taskSettings.gracePeriod,
          retainRecurringTasks: taskSettings.retainRecurringTasks
        },
        showMasterPlan: settings.showMasterPlan ?? false, // Add showMasterPlan
      }
      
      console.log('[DEBUG-SETTINGS] Calling updateSettings...')
      const result = await updateSettings(updatedSettings)
      console.log('[DEBUG-SETTINGS] Update result:', result)

      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings')
      }

      toast({
        title: "Settings Saved",
        description: "Your changes have been saved successfully.",
        duration: 2000
      })
      
      // Show success indicator
      setTaskSettingsSaveSuccess(true)
      setTimeout(() => setTaskSettingsSaveSuccess(false), 3000)
    } catch (error) {
      console.error('[DEBUG-SETTINGS] Error saving settings:', error)
      toast({
        title: "Error Saving Settings",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
        duration: 4000
      })
    } finally {
      console.log('[DEBUG-SETTINGS] Task settings save complete')
      setIsTaskSettingsSaving(false)
    }
  }

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (isEditingKey) {
      setNewApiKey(value)
    } else {
      setLocalKey(value)
    }
  }

  const handleSaveKey = async () => {
    if (isApiKeySaving) {
      console.log('[DEBUG-SETTINGS] Key save already in progress')
      return
    }

    console.log('[DEBUG-SETTINGS] Starting key save operation...')
    setIsApiKeySaving(true)
    
    try {
      // Check if we're using an environment variable
      const envKey = process.env.OPENAI_API_KEY;
      if (envKey) {
        toast({
          title: "Environment Variable Used",
          description: "OpenAI API key is set via environment variable. This cannot be changed in settings.",
          duration: 4000
        });
        setIsApiKeySaving(false);
        return;
      }

      const keyToSave = isEditingKey ? newApiKey : localKey
      if (!keyToSave) {
        throw new Error('Please enter an API key')
      }

      if (!keyToSave.startsWith('sk-')) {
        throw new Error('Invalid API key format. Key should start with sk-')
      }

      console.log('[DEBUG-SETTINGS] Creating settings object for key save...')
      // Preserve all existing settings and only update the openAIKey
      // Filter out Convex metadata fields and only include valid UserSettings fields
      const updatedSettings: UserSettings = {
        goal: settings?.goal,
        openAIKey: keyToSave,
        priority: settings?.priority,
        theme: settings?.theme || 'system',
        autoSave: settings?.autoSave ?? true,
        defaultDueDate: settings?.defaultDueDate ?? 'none',
        showCompletedTasks: settings?.showCompletedTasks || false,
        taskSortOrder: settings?.taskSortOrder ?? 'dueDate',
        autoAnalyze: settings?.autoAnalyze || false,
        syncApiKey: settings?.syncApiKey || false,
        taskSettings: settings?.taskSettings
          ? {
              autoPrioritize: settings.taskSettings.autoPrioritize,
              endOfDayTime: settings.taskSettings.endOfDayTime,
              autoArchiveDelay: settings.taskSettings.autoArchiveDelay,
              gracePeriod: settings.taskSettings.gracePeriod,
              retainRecurringTasks: settings.taskSettings.retainRecurringTasks
            }
          : defaultTaskSettings,
        showMasterPlan: settings?.showMasterPlan || false, // Correctly placed inside
      }
      
      // Save to localStorage for API requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('openai-api-key', keyToSave)
        console.log('[DEBUG-SETTINGS] Saved API key to localStorage')
      }
      
      console.log('[DEBUG-SETTINGS] Calling updateSettings for key...')
      const result = await updateSettings(updatedSettings)

      if (!result.success) {
        throw new Error(result.error || 'Failed to save API key')
      }

      console.log('[DEBUG-SETTINGS] Save successful')
      setLocalKey(keyToSave)
      setIsEditingKey(false)
      setNewApiKey('')
      
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved successfully.",
        duration: 2000
      })
      
      // Show success indicator
      setApiKeySaveSuccess(true)
      setTimeout(() => setApiKeySaveSuccess(false), 3000)
    } catch (error) {
      console.error('[DEBUG-SETTINGS] Error saving API key:', error)
      toast({
        title: "Error Saving API Key",
        description: error instanceof Error ? error.message : "Failed to save API key",
        variant: "destructive",
        duration: 4000
      })
    } finally {
      console.log('[DEBUG-SETTINGS] Key save operation complete')
      setIsApiKeySaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingKey(false)
    setNewApiKey('')
  }

  const handleShowMasterPlanToggle = async (checked: boolean) => {
    console.log('[DEBUG-SETTINGS] Toggling Master Plan visibility:', checked)
    try {
      // Use the updateSettings from the hook
      await updateSettings({ showMasterPlan: checked })
      toast({
        title: "Setting Updated",
        description: `Master Plan page will now be ${checked ? 'shown' : 'hidden'} in the sidebar.`,
        duration: 3000
      })
    } catch (error) {
      console.error('[DEBUG-SETTINGS] Error updating showMasterPlan:', error)
      toast({
        title: "Error Updating Setting",
        description: error instanceof Error ? error.message : "Failed to update Master Plan visibility",
        variant: "destructive",
        duration: 4000
      })
      // Optionally revert the visual state if the update fails, though useSettings might handle this
    }
  }

  return (
    <div>
      <PageIntro showBackButton={true} />
      <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>
      
      <div className="flex flex-col lg:flex-row lg:gap-8">
        <div className="lg:w-1/4 sticky top-0 h-screen">
          <SettingsNav />
        </div>
        
        <div className="flex-1 space-y-6">
          <Card className="p-6 mb-6" id="design-system">
            <CardHeader>
              <CardTitle>Design System</CardTitle>
              <CardDescription>
                View and test the application's UI components and styles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/design-system">
                <Button variant="outline">View Design System</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="p-6 mb-6" id="user-preferences">
            <h2 className="text-xl font-semibold mb-4">User Preferences</h2>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={settings.theme || 'system'}
                  onValueChange={(value: string) => updateSettings({
                    ...settings,
                    theme: value as 'light' | 'dark' | 'system',
                  })}
                >
                  <SelectTrigger id="theme" className="w-full max-w-[240px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Set the theme for the application. System uses your device preference.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t">
                <Label htmlFor="personal-context">Personal Context</Label>
                <Textarea
                  id="personal-context"
                  placeholder="Share your context, priorities, and what makes tasks urgent or important to you..."
                  className="min-h-[160px] resize-y"
                  value={localPersonalContext}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    const newValue = e.target.value;
                    setLocalPersonalContext(newValue);
                    
                    // Also update profile if it exists
                    if (profile) {
                      setProfile({
                        ...profile,
                        personalContext: newValue
                      });
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  This helps our AI better understand how to categorize your tasks.
                </p>
                
                <Button 
                  onClick={() => {
                    setIsProfileSaving(true);
                    // Ensure profile exists before saving
                    if (!profile) {
                      const defaultProfile = {
                        name: '',
                        email: '',
                        theme: 'system' as 'light' | 'dark' | 'system',
                        personalContext: localPersonalContext,
                        isLegacyUser: false
                      };
                      setProfile(defaultProfile);
                    } else {
                      // Update profile with local personal context
                      setProfile({
                        ...profile,
                        personalContext: localPersonalContext
                      });
                    }
                    
                    setTimeout(() => {
                      toast({
                        title: "Success",
                        description: "Your personal context has been updated successfully.",
                        variant: "default",
                      });
                      setIsProfileSaving(false);
                    }, 500);
                  }}
                  className="w-fit mt-2"
                  disabled={isProfileSaving}
                >
                  {isProfileSaving ? (
                    <span className="animate-pulse">Saving...</span>
                  ) : (
                    'Save Context'
                  )}
                </Button>
              </div>

            </div>
          </Card>

          <Card className="p-6 mb-6" id="display-preferences">
            <h2 className="text-xl font-semibold mb-4">Display Preferences</h2>
            <div className="space-y-6">
            </div>
          </Card>

          <Card className="p-6 mb-6" id="feature-visibility">
            <h2 className="text-xl font-semibold mb-4">Feature Visibility</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show-master-plan" className="text-base">Show Master Plan</Label>
                  <p className="text-sm text-muted-foreground">
                    Display the Master Plan page link in the sidebar.
                  </p>
                </div>
                <Switch
                  id="show-master-plan"
                  checked={settings.showMasterPlan ?? false} 
                  onCheckedChange={handleShowMasterPlanToggle}
                  aria-label="Toggle Master Plan visibility in sidebar"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show-sidebars" className="text-base">Show Eisenhower Sidebars</Label>
                  <p className="text-sm text-muted-foreground">
                    Show the sidebars in the Eisenhower Matrix view.
                  </p>
                </div>
                <Switch
                  id="show-sidebars"
                  checked={showSidebars}
                  onCheckedChange={setShowSidebars}
                  aria-label="Toggle Eisenhower sidebars visibility"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="show-goals" className="text-base">Show Goals Section</Label>
                  <p className="text-sm text-muted-foreground">
                    Display the Goals section on the dashboard.
                  </p>
                </div>
                <Switch
                  id="show-goals"
                  checked={showGoalsSection}
                  onCheckedChange={setShowGoalsSection}
                  aria-label="Toggle Goals section visibility"
                />
              </div>

            </div>
          </Card>

          <Card className="p-6 mb-6" id="ai-integration">
            <h2 className="text-xl font-semibold mb-4">AI Integration</h2>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="openAIKey">OpenAI API Key</Label>
                  {mounted && localKey && localKey.startsWith('sk-') && !isEditingKey && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsEditingKey(true)
                        setNewApiKey('')
                      }}
                    >
                      Change Key
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="openAIKey"
                    type="password"
                    value={!mounted ? '' : (isEditingKey ? newApiKey : localKey)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleKeyChange(e)}
                    placeholder="sk-..."
                    className={`font-mono ${(!localKey || !localKey.startsWith('sk-') || isEditingKey) ? 'border-yellow-500' : ''}`}
                    disabled={!!(localKey && localKey.startsWith('sk-') && !isEditingKey)}
                  />
                  {isEditingKey && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="default"
                        onClick={handleSaveKey}
                        disabled={isApiKeySaving}
                      >
                        {isApiKeySaving ? (
                          <span className="inline-flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          'Save'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={handleCancelEdit}
                        disabled={isApiKeySaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  {localKey ? (
                    <p>Your API key is securely stored. Click "Change Key" to update it.</p>
                  ) : (
                    <>
                      <p>Required for AI-powered task analysis and idea detection.</p>
                      <p>
                        <a 
                          href="https://platform.openai.com/api-keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Get your API key from OpenAI →
                        </a>
                      </p>
                    </>
                  )}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="syncApiKey">Cloud Sync</Label>
                        <p className="text-sm text-muted-foreground">
                          Sync your API key across devices (less secure)
                        </p>
                      </div>
                      <Switch
                        id="syncApiKey"
                        checked={settings.syncApiKey || false}
                        onCheckedChange={(checked: boolean) => {
                          const updatedSettings = {
                            ...settings,
                            syncApiKey: checked,
                            // Only include API key in cloud if sync is enabled
                            openAIKey: checked ? localKey : undefined
                          };
                          updateSettings(updatedSettings);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6" id="subscription">
            <h2 className="text-xl font-semibold mb-4">Subscription</h2>
            <div className="space-y-6">
              {/* Subscription Status */}
              <SubscriptionDetails />
            </div>
          </Card>

          <Card className="p-6" id="task-management">
            <h2 className="text-xl font-semibold mb-4">Task Management</h2>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="endOfDayTime">End of Day Time</Label>
                <Input
                  id="endOfDayTime"
                  type="time"
                  value={taskSettings.endOfDayTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskSettings({ ...taskSettings, endOfDayTime: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Tasks will be reviewed at this time each day
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="autoArchiveDelay">Auto-archive Delay (Days)</Label>
                <Input
                  id="autoArchiveDelay"
                  type="number"
                  min="1"
                  max="30"
                  value={taskSettings.autoArchiveDelay}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskSettings({ ...taskSettings, autoArchiveDelay: parseInt(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  Number of days to wait before auto-archiving completed tasks
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
                <Input
                  id="gracePeriod"
                  type="number"
                  min="1"
                  max="90"
                  value={taskSettings.gracePeriod}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskSettings({ ...taskSettings, gracePeriod: parseInt(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  Days to keep archived tasks before permanent deletion
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="retainRecurringTasks">Retain Recurring Tasks</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep completed tasks that appear to be recurring
                  </p>
                </div>
                <Switch
                  id="retainRecurringTasks"
                  checked={taskSettings.retainRecurringTasks}
                  onCheckedChange={(checked: boolean) => setTaskSettings({ ...taskSettings, retainRecurringTasks: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPrioritize">Auto-Prioritize Tasks</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically prioritize tasks based on their urgency and importance
                  </p>
                </div>
                <Switch
                  id="autoPrioritize"
                  checked={taskSettings.autoPrioritize}
                  onCheckedChange={(checked: boolean) => setTaskSettings({ ...taskSettings, autoPrioritize: checked })}
                />
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full relative" 
                disabled={isTaskSettingsSaving}
              >
                {isTaskSettingsSaving ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    {taskSettingsSaveSuccess ? (
                      <span className="text-green-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Saved Successfully
                      </span>
                    ) : (
                      <>
                        Save Changes
                        {JSON.stringify(settings.taskSettings) !== JSON.stringify(taskSettings) && (
                          <span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
                            Unsaved Changes
                          </span>
                        )}
                      </>
                    )}
                  </span>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6" id="data-management">
            <h2 className="text-xl font-semibold mb-4">Data Management</h2>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Export Tasks</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const event = new CustomEvent('exportTasks');
                      window.dispatchEvent(event);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export to CSV
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Export your tasks to a CSV file for backup or analysis
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Restore Backup</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const backupKeys = Object.keys(localStorage)
                        .filter(k => k.startsWith('tasks_backup_'))
                        .sort()
                        .reverse()
                        .slice(0, 10);

                      if (backupKeys.length === 0) {
                        alert('No backups available');
                        return;
                      }

                      const backupList = backupKeys.map(key => {
                        const date = key.split('_backup_')[1];
                        return new Date(date).toLocaleString();
                      }).join('\n');

                      if (confirm(`Choose a backup to restore:\n\n${backupList}\n\nThis will replace your current tasks. Continue?`)) {
                        const tasks = recoverFromBackup('TASKS');
                        if (tasks) {
                          window.dispatchEvent(new CustomEvent('tasksRestored'));
                        } else {
                          alert('Failed to restore tasks');
                        }
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    Restore Backup
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Restore your tasks from a previous backup
                </p>
              </div>
            </div>
          </Card>

          {/* Error Testing - Development Only */}
          <ErrorTest />
        </div>
      </div>
    </div>
  )
}
