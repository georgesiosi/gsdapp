"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Brain, 
  HelpCircle, 
  Github, 
  Menu, 
  Lightbulb, 
  Download, 
  BarChart2, 
  Settings, 
  UserCircle, 
  LogOut,
  User
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useClerk, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function SettingsMenu() {
  const { signOut } = useClerk()
  const { user, isSignedIn } = useUser()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/sign-in")
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {isSignedIn && user?.imageUrl ? (
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
              <AvatarFallback>{user.firstName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          ) : (
            <Menu className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isSignedIn && user && (
          <>
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                <AvatarFallback>{user.firstName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
                <p className="text-sm font-medium">{user.fullName || "User"}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel>Features</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/ideas-bank" className="flex w-full cursor-pointer items-center">
            <Lightbulb className="mr-2 h-4 w-4" />
            <span>Ideas Bank</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/scorecard-history" className="flex w-full cursor-pointer items-center">
            <BarChart2 className="mr-2 h-4 w-4" />
            <span>Scorecard History</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/ai-logs" className="flex w-full cursor-pointer items-center">
            <Brain className="mr-2 h-4 w-4" />
            <span>AI Logs</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuLabel className="mt-2">Data</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            const event = new CustomEvent('exportTasks');
            window.dispatchEvent(event);
          }}
          className="flex w-full cursor-pointer items-center"
        >
          <Download className="mr-2 h-4 w-4" />
          <span>Export Tasks</span>
        </DropdownMenuItem>

        <DropdownMenuLabel className="mt-2">Help & Resources</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a 
            href="https://github.com/georgesiosi/etodoapp" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex w-full cursor-pointer items-center"
          >
            <Github className="mr-2 h-4 w-4" />
            <span>GitHub</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault()
              alert("GSD App is an AI-enhanced task management app that helps you organize tasks using the Eisenhower Matrix method.")
            }}
            className="flex w-full cursor-pointer items-center"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>About</span>
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuLabel className="mt-2">Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="flex w-full cursor-pointer items-center">
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex w-full cursor-pointer items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        {isSignedIn ? (
          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex w-full cursor-pointer items-center text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/sign-in" className="flex w-full cursor-pointer items-center">
              <User className="mr-2 h-4 w-4" />
              <span>Sign In</span>
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
