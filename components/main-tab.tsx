"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MainTabProps {
  id: string
  name: string
  icon: LucideIcon
  isActive: boolean
  onClick: () => void
}

export function MainTab({ id, name, icon: Icon, isActive, onClick }: MainTabProps) {
  // Define background color based on tab type
  let bgColor = ""

  if (id === "home") {
    bgColor = isActive ? "bg-white dark:bg-gray-800" : "bg-blue-50/80 dark:bg-gray-700/40" // Even lighter unselected home tab that harmonizes with blue
  } else if (id === "analyze") {
    bgColor = isActive
      ? "bg-[#FF6699] dark:bg-[#FF6699]/90" // Keep selected analyze tab vibrant
      : "bg-[#FF6699]/40 dark:bg-[#FF6699]/30" // Much lighter unselected analyze tab
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center px-6 py-4 mx-0.5 cursor-pointer transition-all",
        bgColor,
        "rounded-t-md",
        isActive ? "opacity-100 font-medium" : "opacity-90 font-normal", // Increased opacity slightly for better visibility
      )}
      style={{
        borderBottom: "none",
        marginBottom: isActive ? "-1px" : "0",
        position: "relative",
        zIndex: isActive ? 20 : 10,
        height: isActive ? "calc(100% + 1px)" : "auto",
        ...(isActive
          ? {
              boxShadow:
                id === "home"
                  ? "inset 0px 2px 0px 0px rgba(59, 130, 246, 0.5)"
                  : "inset 0px 2px 0px 0px rgba(255, 255, 255, 0.7)",
            }
          : {}),
      }}
    >
      <Icon
        size={18}
        className={`mr-2 ${
          id === "home"
            ? isActive
              ? "text-blue-700 dark:text-blue-100"
              : "text-blue-600/70 dark:text-blue-100/70" // Adjusted for better contrast with lighter bg
            : isActive
              ? "text-white"
              : "text-white/80" // Slightly more visible text for unselected analyze tab
        }`}
      />
      <span
        className={`${
          id === "home"
            ? isActive
              ? "text-blue-700 dark:text-blue-100"
              : "text-blue-600/70 dark:text-blue-100/70" // Adjusted for better contrast with lighter bg
            : isActive
              ? "text-white"
              : "text-white/80" // Slightly more visible text for unselected analyze tab
        }`}
        style={{
          fontWeight: isActive ? 500 : 400, // Reduced weight for unselected tabs
          display: "inline-block",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
    </button>
  )
}
