import { useState, useEffect } from 'react'
import { UserSettings } from '@/types/task'

const defaultSettings: UserSettings = {
  theme: 'system',
  showCompletedTasks: true,
  autoAnalyze: true,
  taskSettings: {
    endOfDayTime: '23:59',
    autoArchiveDelay: 7,
    gracePeriod: 30,
    retainRecurringTasks: true,
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem('user-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error('Error parsing settings:', error)
      }
    }
  }, [])

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings)
    localStorage.setItem('user-settings', JSON.stringify(newSettings))
  }

  return { settings, updateSettings }
}
