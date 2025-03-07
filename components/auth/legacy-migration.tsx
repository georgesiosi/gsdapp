"use client"

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getStorage, setStorage, StorageKey } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

// All the data types we want to migrate
const DATA_TYPES = ['TASKS', 'IDEAS', 'LICENSE', 'USER_PREFERENCES'] as const

interface LegacyMigrationProps {
  userId: string;
  legacyLicense: string;
}

interface UserPreferences {
  userId: string;
  email: string;
  migrationTimestamp: string;
  legacyLicense: string;
  migratedData: { [key in typeof DATA_TYPES[number]]: boolean };
}

const LegacyMigration: React.FC<LegacyMigrationProps> = () => {
  const { isSignedIn, user, isLoaded } = useUser()
  const { toast } = useToast()
  const [showMigration, setShowMigration] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)

  // Check if user has local data that needs migration
  useEffect(() => {
    if (!isLoaded) return

    // Only run this check when user auth state is loaded
    const hasLocalData = checkForLocalData()
    const userPrefs = getStorage('USER_PREFERENCES')
    const needsMigration = hasLocalData && isSignedIn && user && !userPrefs?.userId

    setShowMigration(needsMigration)
  }, [isLoaded, isSignedIn, user])

  // Checks if there's any existing localStorage data to migrate
  const checkForLocalData = (): boolean => {
    return DATA_TYPES.some(key => {
      const data = getStorage(key as StorageKey)
      return data !== null && data !== undefined
    })
  }

  // Handle the migration of all local data to the Clerk user
  const handleMigration = async () => {
    try {
      if (!isSignedIn || !user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to migrate your data",
          variant: "destructive",
        })
        return
      }

      setIsMigrating(true)

      // 1. Associate all existing data with the Clerk user ID
      const userPrefs: UserPreferences = getStorage('USER_PREFERENCES') || {}
      
      // Update user preferences with Clerk user ID and data migration timestamp
      setStorage('USER_PREFERENCES', {
        ...userPrefs,
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        migrationTimestamp: new Date().toISOString(),
        // Preserve license information if it exists
        legacyLicense: getStorage('LICENSE') || userPrefs?.legacyLicense,
        // Track which data types have been migrated
        migratedData: DATA_TYPES.reduce((acc, key) => {
          const hasData = getStorage(key as StorageKey) !== null
          return { ...acc, [key]: hasData }
        }, {})
      })

      // 2. Log migration success
      console.log(`Data successfully associated with Clerk user ID: ${user.id}`)

      // 3. Show success message
      setShowMigration(false)
      toast({
        title: "Migration Complete",
        description: "Your data has been successfully linked to your account",
      })
    } catch (error) {
      console.error('Migration error:', error)
      toast({
        title: "Migration Failed",
        description: "There was a problem migrating your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsMigrating(false)
    }
  }

  // Don't show anything if there's nothing to migrate
  if (!showMigration) return null

  return (
    <div className="fixed inset-x-0 bottom-0 p-4 bg-background border-t z-50">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h3 className="text-lg font-medium">Data Migration Available</h3>
          <p className="text-sm text-muted-foreground">
            We've detected your existing app data. Would you like to link it to your new account?
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowMigration(false)}
            disabled={isMigrating}
          >
            Later
          </Button>
          <Button 
            onClick={handleMigration}
            disabled={isMigrating}
          >
            {isMigrating ? "Migrating..." : "Link My Data"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LegacyMigration;
