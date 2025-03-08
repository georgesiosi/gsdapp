"use client"

import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { TaskSettings } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { ChevronLeft, Download, History } from 'lucide-react'
import Link from 'next/link'
import { SettingsNav } from '@/components/settings/settings-nav'
import { recoverFromBackup } from '@/lib/storage'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isEditingKey, setIsEditingKey] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')
  const [mounted, setMounted] = useState(false)
  const [localKey, setLocalKey] = useState('')
  const [initialLoad, setInitialLoad] = useState(true)
  const [taskSettings, setTaskSettings] = useState<TaskSettings>(
    settings.taskSettings || {
      endOfDayTime: '23:59',
      autoArchiveDelay: 7,
      gracePeriod: 30,
      retainRecurringTasks: true,
    }
  )

  useEffect(() => {
    // Only run initialization once
    if (initialLoad) {
      setMounted(true)
      // Initialize local key state from settings
      if (settings.openAIKey) {
        setLocalKey(settings.openAIKey)
      }
      setInitialLoad(false)
    }
  }, [settings.openAIKey, initialLoad])

  // Handle updates to settings after initial load
  useEffect(() => {
    if (!initialLoad && settings.openAIKey) {
      setLocalKey(settings.openAIKey)
    }
  }, [settings.openAIKey, initialLoad])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings({ ...settings, taskSettings })
      toast({
        title: "Settings Saved",
        description: "Your changes have been saved successfully.",
        duration: 2000
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error Saving Settings",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive"
      })
    }
    setIsSaving(false)
  }

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (isEditingKey) {
      setNewApiKey(value)
    } else {
      setLocalKey(value)
      updateSettings({ ...settings, openAIKey: value })
    }
  }

  const handleSaveKey = () => {
    if (newApiKey) {
      setLocalKey(newApiKey)
      updateSettings({ ...settings, openAIKey: newApiKey })
    }
    setIsEditingKey(false)
    setNewApiKey('')
  }

  const handleCancelEdit = () => {
    setIsEditingKey(false)
    setNewApiKey('')
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/" className="-ml-2">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-8">
        <div className="lg:w-1/4">
          <SettingsNav />
        </div>
        
        <div className="flex-1 space-y-6">
          <Card className="p-6 mb-6" id="ai-integration">
            <h2 className="text-xl font-semibold mb-4">AI Integration</h2>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="openAIKey">OpenAI API Key</Label>
                  {settings.openAIKey && !isEditingKey && (
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
                    value={isEditingKey ? newApiKey : (mounted ? localKey : '')}
                    onChange={handleKeyChange}
                    placeholder="sk-..."
                    className="font-mono"
                    disabled={!!(localKey && !isEditingKey)}
                  />
                  {isEditingKey && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="default"
                        onClick={handleSaveKey}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {settings.openAIKey ? (
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
                </div>
              </div>
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
                  onChange={(e) => setTaskSettings({ ...taskSettings, endOfDayTime: e.target.value })}
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
                  onChange={(e) => setTaskSettings({ ...taskSettings, autoArchiveDelay: parseInt(e.target.value) })}
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
                  onChange={(e) => setTaskSettings({ ...taskSettings, gracePeriod: parseInt(e.target.value) })}
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
                  onCheckedChange={(checked) => setTaskSettings({ ...taskSettings, retainRecurringTasks: checked })}
                />
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full relative" 
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    Save Changes
                    {settings.taskSettings !== taskSettings && (
                      <span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
                        Unsaved changes
                      </span>
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
        </div>
      </div>
    </div>
  )
}
