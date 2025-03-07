"use client"

import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { TaskSettings } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const [isEditingKey, setIsEditingKey] = useState(false)
  const [newApiKey, setNewApiKey] = useState('')
  const [mounted, setMounted] = useState(false)
  const [localKey, setLocalKey] = useState('')
  const [taskSettings, setTaskSettings] = useState<TaskSettings>(
    settings.taskSettings || {
      endOfDayTime: '23:59',
      autoArchiveDelay: 7,
      gracePeriod: 30,
      retainRecurringTasks: true,
    }
  )

  useEffect(() => {
    setMounted(true)
    // Initialize local key state from settings
    if (settings.openAIKey) {
      setLocalKey(settings.openAIKey)
    }
  }, [])

  // Update local key when settings change
  useEffect(() => {
    if (settings.openAIKey) {
      setLocalKey(settings.openAIKey)
    }
  }, [settings.openAIKey])

  const handleSave = () => {
    updateSettings({ ...settings, taskSettings })
  }

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditingKey) {
      setNewApiKey(e.target.value)
    } else {
      updateSettings({ ...settings, openAIKey: e.target.value })
    }
  }

  const handleSaveKey = () => {
    if (newApiKey) {
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
      
      <Card className="p-6 mb-6">
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
                disabled={localKey && !isEditingKey}
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

      <Card className="p-6">
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

          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  )
}
