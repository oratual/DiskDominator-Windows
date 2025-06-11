import React from "react";
import React from "react";
import React from "react";
"use client"

import type { ReactNode } from "react"
import { AIAssistant } from "../shared/ai-assistant"

interface ViewLayoutProps {
  children: ReactNode
  title?: string
}

export function ViewLayout({ children, title }: ViewLayoutProps) {
  return (
    <div className="flex flex-1 h-full overflow-hidden dark:bg-gray-900 dark:text-white">
      {/* AI Assistant Panel */}
      <AIAssistant />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-semibold">{title}</h1>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
