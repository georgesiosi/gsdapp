"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { UserProfile } from "@clerk/nextjs"

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings" className="-ml-2">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <UserProfile routing="hash" />
      </div>
    </div>
  )
}
