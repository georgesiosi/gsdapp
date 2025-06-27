"use client"

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

// Patterns for different types of Convex errors
const AUTH_ERROR_PATTERNS = [
  /not authenticated/i,
  /invalid.*token/i,
  /token.*expired/i,
  /session.*expired/i,
  /unauthorized/i,
  /authentication.*failed/i,
  /no identity found/i,
  /missing user id/i,
  /invalid authentication token/i,
]

const NETWORK_ERROR_PATTERNS = [
  /network.*error/i,
  /fetch.*failed/i,
  /connection.*refused/i,
  /timeout/i,
]

interface ConvexErrorHandlerProps {
  children: React.ReactNode
}

export function ConvexErrorHandler({ children }: ConvexErrorHandlerProps) {
  const { signOut, isLoaded } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Only set up error handling after auth is loaded
    if (!isLoaded) return

    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      
      // Check if it's a ConvexError or authentication-related error
      if (error && typeof error === 'object') {
        const errorMessage = error.message || error.toString()
        
        console.error('Unhandled rejection detected:', {
          error,
          message: errorMessage,
          type: typeof error,
          stack: error.stack,
        })

        // Handle authentication errors
        if (AUTH_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage))) {
          console.log('Authentication error detected, handling gracefully')
          
          // Prevent the default unhandled rejection behavior
          event.preventDefault()
          
          // Show user-friendly message
          toast({
            title: "Session Expired",
            description: "Your login session has expired. Please sign in again to continue.",
            variant: "destructive",
          })

          // Wait a moment then redirect to sign in
          setTimeout(async () => {
            try {
              await signOut()
              router.push('/sign-in')
            } catch (signOutError) {
              console.error('Error during sign out:', signOutError)
              // Force redirect if sign out fails
              window.location.href = '/sign-in'
            }
          }, 2000)
          
          return
        }

        // Handle network errors
        if (NETWORK_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage))) {
          console.log('Network error detected, handling gracefully')
          
          // Prevent the default unhandled rejection behavior
          event.preventDefault()
          
          toast({
            title: "Connection Issue",
            description: "We're having trouble connecting to our servers. Please check your internet connection and try again.",
            variant: "destructive",
          })
          
          return
        }

        // Handle other ConvexErrors
        if (errorMessage.toLowerCase().includes('convex') || error.name === 'ConvexError') {
          console.log('Convex error detected, handling gracefully')
          
          // Prevent the default unhandled rejection behavior
          event.preventDefault()
          
          toast({
            title: "Something went wrong",
            description: "We encountered an unexpected issue. Please try refreshing the page.",
            variant: "destructive",
          })
          
          return
        }
      }

      // Let other errors bubble up normally
      console.error('Unhandled rejection (not handled by ConvexErrorHandler):', error)
    }

    // Global error handler for regular errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error
      
      if (error && typeof error === 'object') {
        const errorMessage = error.message || error.toString()
        
        console.error('Global error detected:', {
          error,
          message: errorMessage,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        })

        // Handle authentication errors in regular errors too
        if (AUTH_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage))) {
          console.log('Authentication error in global handler, handling gracefully')
          
          // Prevent the default error behavior
          event.preventDefault()
          
          toast({
            title: "Session Expired",
            description: "Your login session has expired. Please sign in again to continue.",
            variant: "destructive",
          })

          setTimeout(async () => {
            try {
              await signOut()
              router.push('/sign-in')
            } catch (signOutError) {
              console.error('Error during sign out:', signOutError)
              window.location.href = '/sign-in'
            }
          }, 2000)
          
          return
        }
      }
    }

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [isLoaded, signOut, router, toast])

  return <>{children}</>
}