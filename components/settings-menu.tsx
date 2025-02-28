"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, Brain, HelpCircle, Github } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function SettingsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/ai-logs" className="flex w-full cursor-pointer items-center">
            <Brain className="mr-2 h-4 w-4" />
            <span>AI Logs</span>
          </Link>
        </DropdownMenuItem>
        
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
              alert("Priority Matrix is an AI-enhanced task management app that helps you organize tasks using the Eisenhower Matrix method.")
            }}
            className="flex w-full cursor-pointer items-center"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>About</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
