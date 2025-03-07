"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ChevronLeft, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileFormData } from "@/types/profile"
import { useProfile } from "@/hooks/use-profile"

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme.",
  }),
  personalContext: z.string().optional(),
  licenseKey: z.string().optional(),
})

export default function ProfilePage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const { profile, setProfile, initializeProfile } = useProfile()

  // Initialize legacy status for existing users
  useEffect(() => {
    initializeProfile()
  }, [])

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
      email: profile?.email || "",
      theme: profile?.theme || "system",
      personalContext: profile?.personalContext || "",
      licenseKey: profile?.licenseKey || "",
    },
  })

  async function onSubmit(data: ProfileFormData) {
    setIsSaving(true)
    
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setProfile(data)
      form.reset(data) // Reset form with new data
      
      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container max-w-2xl py-10">
      <Button
        variant="ghost"
        className="mb-4 flex items-center gap-1"
        onClick={() => router.back()}
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Update your profile information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personalContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Context</FormLabel>
                    <FormDescription>
                      Tell us about yourself, your priorities, and what makes tasks urgent or important to you. 
                      This helps our AI better understand how to categorize your tasks.
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Share your context here..."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licenseKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      License Key
                      {profile?.licenseStatus === 'legacy' && (
                        <span className="flex items-center gap-1 text-sm text-blue-600">
                          <CheckCircle className="h-4 w-4" />
                          Legacy Access
                        </span>
                      )}
                      {profile?.licenseStatus === 'active' && (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Active
                        </span>
                      )}
                      {profile?.licenseStatus === 'inactive' && (
                        <span className="flex items-center gap-1 text-sm text-yellow-600">
                          <AlertCircle className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </FormLabel>
                    <FormDescription>
                      {profile?.isLegacyUser 
                        ? "You have lifetime access as an existing user."
                        : profile?.licenseStatus === 'active'
                        ? "Your license is active and valid."
                        : "Enter your license key to activate the full version."}
                    </FormDescription>
                    <FormControl>
                      <Input
                        placeholder={profile?.isLegacyUser ? "Lifetime Access Granted" : "Enter your license key"}
                        {...field}
                        disabled={profile?.isLegacyUser}
                        className={profile?.licenseStatus === 'legacy' ? 'bg-blue-50' : 
                                 profile?.licenseStatus === 'active' ? 'bg-green-50' : 
                                 'bg-white'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                disabled={isSaving}
                className="relative"
              >
                <span className={`${isSaving ? 'invisible' : 'visible'}`}>
                  Save Changes
                </span>
                {isSaving && (
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    Saving...
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
