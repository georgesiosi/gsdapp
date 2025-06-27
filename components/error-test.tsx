"use client"

import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'

// Component for testing error handling (only visible in development)
export function ErrorTest() {
  const { signOut } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const triggerAuthError = () => {
    const error = new Error('Not authenticated - please sign in. This may happen if your session has expired or if you\'re not properly logged in.')
    throw error
  }

  const triggerConvexError = () => {
    const error = new Error('ConvexError: Invalid authentication token - missing user ID')
    throw error
  }

  const triggerNetworkError = () => {
    const error = new Error('Network error: fetch failed')
    throw error
  }

  const triggerPromiseRejection = () => {
    Promise.reject(new Error('Token expired - please refresh your session'))
  }

  const forceSignOut = async () => {
    try {
      await signOut()
      window.location.reload()
    } catch (err) {
      console.error('Error during force sign out:', err)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
        Error Testing (Dev Only)
      </h3>
      <div className="space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={triggerAuthError}
          className="mr-2"
        >
          Test Auth Error
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={triggerConvexError}
          className="mr-2"
        >
          Test Convex Error
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={triggerNetworkError}
          className="mr-2"
        >
          Test Network Error
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={triggerPromiseRejection}
          className="mr-2"
        >
          Test Promise Rejection
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={forceSignOut}
          className="mr-2"
        >
          Force Sign Out
        </Button>
      </div>
    </div>
  )
}