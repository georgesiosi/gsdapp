"use client"

import { useState, useEffect } from "react"
import { yupResolver } from "@hookform/resolvers/yup"
import { useForm } from "react-hook-form"
import * as yup from "yup"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ChevronLeft, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Form as FormRoot,
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

const profileSchema = yup.object().shape({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().required('Email is required').email('Please enter a valid email address'),
  theme: yup.string().required('Theme is required').oneOf(['light', 'dark', 'system'] as const, 'Please select a valid theme'),
  personalContext: yup.string().default(''),
  licenseKey: yup.string().optional().default('')
})

export default function ProfilePage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const { profile, setProfile, initializeProfile } = useProfile()

  // Initialize legacy status for existing users
  useEffect(() => {
    initializeProfile()
  }, [initializeProfile])

  const form = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || '',
      theme: profile?.theme || 'system',
      personalContext: profile?.personalContext || '',
      licenseKey: profile?.licenseKey || '',
    } as ProfileFormData,
  })

  async function onSubmit(data: ProfileFormData) {
    setIsSaving(true)
    
    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setProfile(data)
      // form.reset(data) // Reset form with new data
      
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
          <FormRoot {...form}>
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
                className="relative w-full"
              >
                {isSaving ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    Save Changes
                    {form.getValues() && Object.keys(form.formState.dirtyFields).length > 0 && (
                      <span className="ml-2 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
                        Unsaved changes
                      </span>
                    )}
                  </span>
                )}
              </Button>
            </form>
          </FormRoot>
        </CardContent>
      </Card>
    </div>
  )
}
