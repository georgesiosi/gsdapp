import { useState, useEffect } from 'react'
import { UserSettings } from '@/types/task'

const defaultSettings: UserSettings = {
  theme: 'system',
  showCompletedTasks: true,
  autoAnalyze: true,
  openAIKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  taskSettings: {
    endOfDayTime: '23:59',
    autoArchiveDelay: 7,
    gracePeriod: 30,
    retainRecurringTasks: true,
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem('user-settings')
    let parsedSettings: UserSettings | null = null

    if (savedSettings) {
      try {
        parsedSettings = JSON.parse(savedSettings)
      } catch (error) {
        console.error('Error parsing settings:', error)
      }
    }

    // Handle OpenAI key initialization
    const envKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
    const currentKey = parsedSettings?.openAIKey || ''

    // If we have a saved key, use it; otherwise use env key if available
    const finalKey = currentKey || envKey || ''
    
    // Merge settings with proper key handling
    const mergedSettings = {
      ...defaultSettings,
      ...parsedSettings,
      openAIKey: finalKey
    }

    setSettings(mergedSettings)
    
    // Only save to localStorage if we have changes
    if (!savedSettings || mergedSettings.openAIKey !== currentKey) {
      localStorage.setItem('user-settings', JSON.stringify(mergedSettings))
    }

    setInitialized(true)
  }, [])

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings)
    localStorage.setItem('user-settings', JSON.stringify(newSettings))
  }

  return { settings, updateSettings }
}
