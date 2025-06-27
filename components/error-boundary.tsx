"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

// Auth-specific error patterns
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

const CONVEX_ERROR_PATTERNS = [
  /convexerror/i,
  /convex.*error/i,
  /database.*error/i,
]

// Check if error is authentication-related
function isAuthError(error: Error): boolean {
  const message = error.message || error.toString()
  return AUTH_ERROR_PATTERNS.some(pattern => pattern.test(message))
}

// Check if error is Convex-related
function isConvexError(error: Error): boolean {
  const message = error.message || error.toString()
  return CONVEX_ERROR_PATTERNS.some(pattern => pattern.test(message))
}

// Default error fallback component
function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter()
  const { signOut } = useAuth()
  const isAuth = isAuthError(error)
  const isConvex = isConvexError(error)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/sign-in')
    } catch (err) {
      console.error('Error signing out:', err)
      // Force redirect if sign out fails
      window.location.href = '/sign-in'
    }
  }

  const handleHardRefresh = () => {
    window.location.reload()
  }

  const getErrorTitle = () => {
    if (isAuth) return "Authentication Required"
    if (isConvex) return "Connection Issue"
    return "Something went wrong"
  }

  const getErrorDescription = () => {
    if (isAuth) {
      return "Your session has expired or you're not properly logged in. Please sign in again to continue."
    }
    if (isConvex) {
      return "We're having trouble connecting to our servers. This is usually temporary."
    }
    return "An unexpected error occurred. We've logged the issue and will look into it."
  }

  const getPrimaryAction = () => {
    if (isAuth) {
      return (
        <Button onClick={handleSignOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign In Again
        </Button>
      )
    }
    return (
      <Button onClick={handleHardRefresh} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Refresh Page
      </Button>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-16 w-16 text-yellow-500" />
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {getErrorTitle()}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {getErrorDescription()}
        </p>

        <div className="space-y-3">
          {getPrimaryAction()}
          
          <Button 
            variant="outline" 
            onClick={reset} 
            className="w-full"
          >
            Try Again
          </Button>
        </div>

        {/* Show technical details in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Technical Details (Dev Only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Log error details for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      isAuthError: isAuthError(error),
      isConvexError: isConvexError(error),
    })

    this.setState({
      hasError: true,
      error,
      errorInfo,
    })
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} reset={this.reset} />
    }

    return this.props.children
  }
}

// Hook version for function components
export function useErrorHandler() {
  const router = useRouter()
  const { signOut } = useAuth()

  const handleError = React.useCallback((error: Error) => {
    console.error('Handled error:', error)
    
    if (isAuthError(error)) {
      // Show user-friendly message and redirect to sign in
      const shouldSignOut = window.confirm(
        'Your session has expired. Would you like to sign in again?'
      )
      
      if (shouldSignOut) {
        signOut().then(() => {
          router.push('/sign-in')
        }).catch(() => {
          // Force redirect if sign out fails
          window.location.href = '/sign-in'
        })
      }
    } else if (isConvexError(error)) {
      // For Convex errors, suggest a refresh
      const shouldRefresh = window.confirm(
        'We\'re having trouble connecting to our servers. Would you like to refresh the page?'
      )
      
      if (shouldRefresh) {
        window.location.reload()
      }
    } else {
      // For other errors, just log them
      console.error('Unhandled error:', error)
    }
  }, [router, signOut])

  return { handleError }
}