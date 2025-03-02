"use client"

import { useState } from 'react'
import { useSettings } from '@/hooks/use-settings'
import { TaskSettings } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const [taskSettings, setTaskSettings] = useState<TaskSettings>(
    settings.taskSettings || {
      endOfDayTime: '23:59',
      autoArchiveDelay: 7,
      gracePeriod: 30,
      retainRecurringTasks: true,
    }
  )

  const handleSave = () => {
    updateSettings({ ...settings, taskSettings })
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
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
