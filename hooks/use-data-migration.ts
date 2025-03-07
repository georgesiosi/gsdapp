// hooks/use-data-migration.ts
// A hook to handle the migration of user data from localStorage to Clerk user account

import { useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import StorageManager, { StorageKey } from '@/lib/storage'
import { useToast } from '@/components/ui/use-toast'

// All data types we want to migrate and link to the user
const DATA_TYPES = ['TASKS', 'IDEAS', 'LICENSE', 'USER_PREFERENCES'] as const

interface MigrationResult {
  success: boolean
  message: string
  migratedDataTypes: string[]
}

export function useDataMigration() {
  const { isSignedIn, user, isLoaded } = useUser()
  const { toast } = useToast()
  const [isMigrating, setIsMigrating] = useState(false)

  // Check if there's local data that needs migration
  const checkForLocalData = useCallback((): boolean => {
    return DATA_TYPES.some(key => {
      const data = StorageManager.get(key as StorageKey)
      return data !== null && data !== undefined
    })
  }, [])

  // Check if the user needs migration (has local data but no userId in preferences)
  const needsMigration = useCallback((): boolean => {
    if (!isLoaded || !isSignedIn || !user) return false
    
    const hasLocalData = checkForLocalData()
    const userPrefs = StorageManager.get('USER_PREFERENCES')
    
    return hasLocalData && !userPrefs?.userId
  }, [isLoaded, isSignedIn, user, checkForLocalData])

  // Migrate all local data to be associated with the Clerk user
  const migrateUserData = useCallback(async (): Promise<MigrationResult> => {
    if (!isSignedIn || !user) {
      return {
        success: false,
        message: "You must be signed in to migrate data",
        migratedDataTypes: []
      }
    }

    try {
      setIsMigrating(true)

      // Get existing user preferences or create empty object
      const userPrefs = StorageManager.get('USER_PREFERENCES') || {}
      
      // Track which data types have been migrated
      const migratedData = DATA_TYPES.reduce((acc, key) => {
        const hasData = StorageManager.get(key as StorageKey) !== null
        return { ...acc, [key]: hasData }
      }, {})

      // Update user preferences with Clerk user ID and migration data
      StorageManager.set('USER_PREFERENCES', {
        ...userPrefs,
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        migrationTimestamp: new Date().toISOString(),
        legacyLicense: StorageManager.get('LICENSE') || userPrefs?.legacyLicense,
        migratedData
      })

      // Log migration success
      console.log(`Data migration successful for user ID: ${user.id}`)
      console.log('Migrated data types:', migratedData)

      // Return successful result
      return {
        success: true,
        message: "Your data has been successfully linked to your account",
        migratedDataTypes: Object.keys(migratedData).filter(key => migratedData[key as keyof typeof migratedData])
      }
    } catch (error) {
      console.error('Data migration error:', error)
      
      // Return failure result
      return {
        success: false,
        message: "There was a problem migrating your data",
        migratedDataTypes: []
      }
    } finally {
      setIsMigrating(false)
    }
  }, [isSignedIn, user])

  return {
    isMigrating,
    needsMigration,
    checkForLocalData,
    migrateUserData
  }
}
