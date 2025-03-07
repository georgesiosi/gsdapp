"use client"

import dynamic from "next/dynamic"

// Dynamically import the ServiceWorkerRegistration component with SSR disabled
// in a dedicated client component wrapper
const ServiceWorkerRegistration = dynamic(
  () => import("./service-worker-registration").then(mod => mod.ServiceWorkerRegistration),
  { ssr: false }
)

export function ServiceWorkerWrapper() {
  return <ServiceWorkerRegistration />
}
