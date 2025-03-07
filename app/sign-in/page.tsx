"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn 
        afterSignInUrl="/" 
        signUpUrl="/sign-up" 
        routing="hash"
      />
    </div>
  )
}
