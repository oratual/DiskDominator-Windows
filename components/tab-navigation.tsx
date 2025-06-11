import React from "react";
import React from "react";
import React from "react";
import React from "react";
"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface TabProps {
  id: string
  name: string
  icon: LucideIcon
  isActive: boolean
  onClick: () => void
  type: "main" | "secondary"
  collapsed?: boolean
}

export function TabNavigation({
  tabs,
  activeTab,
  setActiveTab,
  type,
  collapsed = false,
}: {
  tabs: Array<{ id: string; name: string; icon: LucideIcon; color: string }>
  activeTab: string
  setActiveTab: (id: string) => void
  type: "main" | "secondary"
  collapsed?: boolean
}) {
  return (
    <div className="flex">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        // Define colors based on tab type and id
        let bgColor = ""
        let textColorClass = ""

        if (type === "main") {
          if (tab.id === "home") {
            bgColor = isActive ? "bg-card dark:bg-card" : "bg-muted dark:bg-muted"
            textColorClass = isActive ? "text-blue-800 dark:text-gray-100" : "text-gray-700 dark:text-white"
          } else if (tab.id === "analyze") {
            bgColor = isActive ? "bg-[hsl(var(--color-tab-analyze-active-bg))]" : "bg-[hsl(var(--color-tab-analyze-inactive-bg))]"
            textColorClass = "text-white"
          }
        } else {
          if (tab.id === "duplicates") {
            bgColor = isActive ? "bg-[hsl(var(--color-tab-duplicates-active-bg))]" : "bg-[hsl(var(--color-tab-duplicates-inactive-bg))]"
          } else if (tab.id === "bigfiles") {
            bgColor = isActive ? "bg-green-500 dark:bg-green-600" : "bg-green-700 dark:bg-green-800"
          } else if (tab.id === "organize") {
            bgColor = isActive ? "bg-[hsl(var(--color-tab-organize-active-bg))]" : "bg-[hsl(var(--color-tab-organize-inactive-bg))]"
          }
          textColorClass = "text-white"
        }

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center px-6 py-4 mx-0.5 cursor-pointer transition-all",
              bgColor,
              "rounded-t-md",
              isActive ? "opacity-100 font-medium" : "opacity-80 font-normal",
              collapsed ? "flex-col h-auto" : "",
            )}
            style={{
              borderBottom: "none",
              marginBottom: isActive ? "-1px" : "0",
              position: "relative",
              zIndex: isActive ? 20 : 10,
              height: collapsed ? "auto" : isActive ? "calc(100% + 1px)" : "auto",
              ...(isActive
                ? {
                    boxShadow: "inset 0px 2px 0px 0px rgba(255,255,255,0.7)",
                  }
                : {}),
            }}
          >
            <Icon size={18} className={`${collapsed ? "mb-2" : "mr-2"} ${textColorClass}`} />
            {collapsed ? (
              <span
                className={`${textColorClass} text-xs`}
                style={{
                  fontWeight: 500,
                  writingMode: "vertical-rl",
                  textOrientation: "mixed",
                  transform: "rotate(180deg)",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  height: "100%",
                  marginTop: "8px",
                }}
              >
                {tab.name}
              </span>
            ) : (
              <span
                className={textColorClass}
                style={{
                  fontWeight: 500,
                  display: "inline-block",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.name}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
