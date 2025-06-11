import React from "react";
import React from "react";
import React from "react";
import React from "react";
"use client"

import { useEffect, useState } from "react"

// Define the available color filter types
export type ColorFilterType = "none" | "grayscale" | "protanopia" | "deuteranopia" | "tritanopia"

// Create a context to manage the color filter state
export const applyColorFilter = (filter: ColorFilterType) => {
  // Only run this on the client
  if (typeof window === "undefined") return

  // Remove all existing filter classes
  document.documentElement.classList.remove(
    "filter-grayscale",
    "filter-protanopia",
    "filter-deuteranopia",
    "filter-tritanopia",
  )

  // Add the selected filter class if it's not "none"
  if (filter !== "none") {
    document.documentElement.classList.add(`filter-${filter}`)

    // For debugging - log the applied filter
    console.log(`Applied color filter: ${filter}`)
  } else {
    console.log("Removed all color filters")
  }
}

// Component to test color filters
export function ColorFilterTest() {
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50">
      <h3 className="text-sm font-medium mb-2">Test Color Filters</h3>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => applyColorFilter("none")}
          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
        >
          None
        </button>
        <button
          onClick={() => applyColorFilter("grayscale")}
          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
        >
          Grayscale
        </button>
        <button
          onClick={() => applyColorFilter("protanopia")}
          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
        >
          Protanopia
        </button>
        <button
          onClick={() => applyColorFilter("deuteranopia")}
          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
        >
          Deuteranopia
        </button>
        <button
          onClick={() => applyColorFilter("tritanopia")}
          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
        >
          Tritanopia
        </button>
      </div>
    </div>
  )
}

// Component to initialize color filters
export default function ColorFilterManager() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if there's a saved preference
    const savedFilter = localStorage.getItem("colorFilter") as ColorFilterType | null

    if (savedFilter) {
      applyColorFilter(savedFilter)
    }

    // For development - add the test component
    if (process.env.NODE_ENV === "development") {
      const testElement = document.createElement("div")
      testElement.id = "color-filter-test"
      document.body.appendChild(testElement)

      // We would render the ColorFilterTest component here in a real app
      // For now, we'll just add a simple message
      testElement.innerHTML = `
        <div style="position: fixed; bottom: 4px; right: 4px; padding: 8px; background: white; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 9999;">
          Color filters initialized
        </div>
      `

      // Remove after 3 seconds
      setTimeout(() => {
        if (testElement && testElement.parentNode) {
          testElement.parentNode.removeChild(testElement)
        }
      }, 3000)
    }

    return () => {
      // Cleanup if needed
      const testElement = document.getElementById("color-filter-test")
      if (testElement && testElement.parentNode) {
        testElement.parentNode.removeChild(testElement)
      }
    }
  }, [])

  if (!mounted) return null
  return null
}
