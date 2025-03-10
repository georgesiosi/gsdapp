"use client"

import { useState, useEffect } from 'react'
import { useMutation, useConvexAuth } from 'convex/react'
import { useAuth } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function ConvexTest() {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionInfo, setConnectionInfo] = useState<any>(null)
  
  // Get auth state information
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const auth = useAuth()
  
  // Get the test mutation
  const testConnection = useMutation(api.tasks.testConnection)
  
  // Check authentication status when component loads
  useEffect(() => {
    const authDetails = {
      clerk: {
        isLoaded: auth.isLoaded,
        isSignedIn: auth.isSignedIn,
        userId: auth.userId,
        sessionId: auth.sessionId,
      },
      convex: {
        isAuthenticated,
        isLoading: isAuthLoading,
      },
      environment: {
        convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONTEXT_STAGING_NEXT_PUBLIC_CONVEX_URL,
        clerkIssuer: process.env.NEXT_PUBLIC_CLERK_ISSUER_URL || process.env.CONTEXT_STAGING_NEXT_PUBLIC_CLERK_ISSUER_URL,
      }
    }
    
    setConnectionInfo(authDetails)
    console.log('Convex connection details:', authDetails)
  }, [auth.isLoaded, auth.isSignedIn, auth.userId, auth.sessionId, isAuthenticated, isAuthLoading])
  
  const runTest = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('📡 Starting Convex connection test...')
      const startTime = performance.now()
      
      const response = await testConnection()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Add timing information to the response
      const enhancedResponse = {
        ...response,
        timing: {
          durationMs: Math.round(duration),
          timestamp: new Date().toISOString()
        }
      }
      
      setResult(enhancedResponse)
      console.log('✅ Convex test completed in ' + Math.round(duration) + 'ms:', enhancedResponse)
    } catch (err) {
      console.error('❌ Error testing Convex connection:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Convex Connection Test</h2>
      
      {/* Connection Status Overview */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold mb-2">Connection Status</h3>
        {connectionInfo ? (
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connectionInfo.clerk.isSignedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Clerk Auth: {connectionInfo.clerk.isSignedIn ? 'Signed In' : 'Not Signed In'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connectionInfo.convex.isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Convex Auth: {connectionInfo.convex.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <p>User ID: {connectionInfo.clerk.userId || 'Not available'}</p>
              <p>Session ID: {connectionInfo.clerk.sessionId || 'Not available'}</p>
              <p>Convex URL: {connectionInfo.environment.convexUrl || 'Not configured'}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Loading connection details...</p>
        )}
      </div>
      
      {/* Test Button */}
      <Button 
        onClick={runTest} 
        disabled={isLoading}
        className="mb-4 w-full"
        variant={connectionInfo?.convex.isAuthenticated ? "default" : "outline"}
      >
        {isLoading ? 'Running Test...' : 'Test Convex Connection'}
      </Button>
      
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 mb-4">
          <h3 className="font-semibold">Error:</h3>
          <p className="mt-1">{error}</p>
          <p className="text-xs mt-2 text-red-600">
            Check your browser console for more detailed error information.
          </p>
        </div>
      )}
      
      {/* Test Results */}
      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
          <h3 className="font-semibold flex items-center gap-2">
            {result.success ? '✅ Test Successful' : '❌ Test Failed'}
            {result.timing && (
              <span className="text-xs font-normal text-green-600">
                ({result.timing.durationMs}ms)
              </span>
            )}
          </h3>
          
          <div className="mt-3 space-y-2 text-sm">
            {result.message && <p><span className="font-medium">Message:</span> {result.message}</p>}
            {result.userId && <p><span className="font-medium">User ID:</span> {result.userId}</p>}
            {result.testTaskId && <p><span className="font-medium">Test Task ID:</span> {result.testTaskId}</p>}
            {result.taskCount !== undefined && <p><span className="font-medium">Task Count:</span> {result.taskCount}</p>}
            {result.error && <p><span className="font-medium">Error:</span> {result.error}</p>}
          </div>
          
          {result.timing && (
            <div className="mt-3 pt-2 border-t border-green-200 text-xs text-green-600">
              Test completed at {new Date(result.timing.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
