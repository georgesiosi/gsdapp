"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Ensure we only render icons after hydration to prevent flashing
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  if (!mounted) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 hover:bg-muted/30 transition-colors relative rounded-md"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-4 h-4">
        <Sun 
          className="absolute inset-0 h-full w-full rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" 
          aria-hidden="true"
        />
        <Moon 
          className="absolute inset-0 h-full w-full rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" 
          aria-hidden="true"
        />
      </div>
    </Button>
  )
}
