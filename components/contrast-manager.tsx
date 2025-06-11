import React from "react";
import React from "react";
import React from "react";
import React from "react";
"use client"

import { useEffect, useState } from "react"

// Define the available contrast levels
export type ContrastLevel = "normal" | "high"

// Function to apply contrast
export const applyContrast = (level: ContrastLevel) => {
  // Only run this on the client
  if (typeof window === "undefined") return

  // Remove high contrast class if it exists
  document.documentElement.classList.remove("high-contrast")

  // Add the high contrast class if selected
  if (level === "high") {
    document.documentElement.classList.add("high-contrast")
    console.log("Applied high contrast mode")
  } else {
    console.log("Removed high contrast mode")
  }

  // Save the preference to localStorage
  localStorage.setItem("contrastLevel", level)
}

// Component to initialize contrast settings
export default function ContrastManager() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if there's a saved preference
    const savedContrast = localStorage.getItem("contrastLevel") as ContrastLevel | null

    if (savedContrast) {
      applyContrast(savedContrast)
    }

    // For development - add a visual indicator
    if (process.env.NODE_ENV === "development") {
      const testElement = document.createElement("div")
      testElement.id = "contrast-test"
      testElement.style.position = "fixed"
      testElement.style.bottom = "40px"
      testElement.style.right = "4px"
      testElement.style.padding = "8px"
      testElement.style.background = "white"
      testElement.style.color = "black"
      testElement.style.borderRadius = "4px"
      testElement.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"
      testElement.style.zIndex = "9999"
      testElement.style.fontSize = "12px"
      testElement.textContent = `Contrast: ${savedContrast || "normal"}`
      document.body.appendChild(testElement)

      // Remove after 3 seconds
      setTimeout(() => {
        if (testElement && testElement.parentNode) {
          testElement.parentNode.removeChild(testElement)
        }
      }, 3000)
    }

    return () => {
      // Cleanup if needed
      const testElement = document.getElementById("contrast-test")
      if (testElement && testElement.parentNode) {
        testElement.parentNode.removeChild(testElement)
      }
    }
  }, [])

  if (!mounted) return null
  return null
}
