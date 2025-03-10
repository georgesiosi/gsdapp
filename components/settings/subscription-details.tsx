"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

export function SubscriptionDetails() {
  const { user } = useUser()
  const subscription = useQuery(api.subscription.getCurrentSubscription, {
    userId: user?.id,
  })

  if (!subscription) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isActive = subscription.status === "active"
  const tier = subscription.tier
  const validUntil = subscription.validUntil
    ? new Date(subscription.validUntil).toLocaleDateString()
    : "N/A"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Details</CardTitle>
        <CardDescription>
          Manage your subscription and billing details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge variant={isActive ? "default" : "destructive"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Plan</span>
          <Badge variant="outline" className="capitalize">
            {tier}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Valid Until</span>
          <span className="text-sm text-muted-foreground">{validUntil}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => window.open("https://polar.sh/georgesiosi/gsdapp", "_blank")}>
          View Plans
        </Button>
        {isActive && (
          <Button variant="default" onClick={() => window.open("https://polar.sh/dashboard/subscriptions", "_blank")}>
            Manage Subscription
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
