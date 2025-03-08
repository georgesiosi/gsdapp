"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

// Dynamically import the ServiceWorkerRegistration component with SSR disabled
// in a dedicated client component wrapper
const ServiceWorkerRegistration = dynamic(
  () => import("./service-worker-registration").then(mod => mod.ServiceWorkerRegistration),
  { 
    ssr: false,
    loading: () => null // Don't show any loading state
  }
)

export function ServiceWorkerWrapper() {
  // Wrap in Suspense to handle loading states gracefully
  return (
    <Suspense fallback={null}>
      <ServiceWorkerRegistration />
    </Suspense>
  )
}
