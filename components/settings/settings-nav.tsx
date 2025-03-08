"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

const sections = [
  {
    id: "ai-integration",
    label: "AI Integration",
    hash: "#ai-integration"
  },
  {
    id: "task-management",
    label: "Task Management",
    hash: "#task-management"
  },
  {
    id: "data-management",
    label: "Data Management",
    hash: "#data-management"
  }
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-row space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
      {sections.map((section) => (
        <Link
          key={section.id}
          href={section.hash}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            pathname + section.hash === pathname + window?.location?.hash
              ? "bg-accent"
              : "transparent"
          )}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  )
}
