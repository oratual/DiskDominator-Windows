"use client"

import { useState, useEffect } from "react"
import { HardDrive, Copy, FileText, LayoutGrid, RefreshCw, Home } from "lucide-react"
import DuplicatesView from "./views/duplicates-view"
import BigFilesView from "./views/big-files-view"
import OrganizeView from "./views/organize-view"
import DiskStatusView from "./views/disk-status-view"
import UserMenu from "./fixed-user-menu"
import UserProfileButton from "./user-profile-button"
import HomeView from "./views/home-view"
import { useTheme } from "next-themes"
import { TabNavigation } from "./tab-navigation"

export default function DiskDominatorV2() {
  // Tab state management
  const [activeTab, setActiveTab] = useState("duplicates")
  const { resolvedTheme } = useTheme()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Theme detection
  const isDark = resolvedTheme === "dark"

  // Tab definitions
  const mainTabs = [
    { id: "home", name: "Inicio", icon: Home, color: "white" },
    { id: "analyze", name: "Analizador", icon: RefreshCw, color: "magenta" },
  ]

  const secondaryTabs = [
    { id: "duplicates", name: "Duplicados", icon: Copy, color: "turquoise" },
    { id: "bigfiles", name: "Archivos Gigantes", icon: FileText, color: "green" },
    { id: "organize", name: "Ordenar Disco", icon: LayoutGrid, color: "purple" },
  ]

  // Accessibility settings management
  useEffect(() => {
    const applyReadabilitySettings = () => {
      const container = document.querySelector(".disk-dominator-container")
      if (container) {
        // Apply enhanced readability if enabled
        if (document.documentElement.classList.contains("enhanced-readability")) {
          container.classList.add("readability-enhanced")
        } else {
          container.classList.remove("readability-enhanced")
        }

        // Apply high contrast if enabled
        if (document.documentElement.classList.contains("high-contrast")) {
          container.classList.add("high-contrast-content")
        } else {
          container.classList.remove("high-contrast-content")
        }

        // Apply wide spacing if enabled
        if (document.documentElement.classList.contains("wide-spacing")) {
          container.classList.add("wide-spacing-content")
        } else {
          container.classList.remove("wide-spacing-content")
        }
      }
    }

    // Initial application of settings
    applyReadabilitySettings()

    // Observer to detect changes to document classes
    const observer = new MutationObserver(applyReadabilitySettings)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  // Optimize performance and prevent continuous processing
  useEffect(() => {
    // Use requestIdleCallback to defer non-essential work
    const handleIdleProcessing = () => {
      // Clear any unnecessary timers or intervals that might be running
      const allIntervals = window._intervals || []
      if (allIntervals.length > 5) {
        // Keep only essential intervals
        allIntervals.slice(5).forEach((id) => clearInterval(id))
      }
    }

    // Use requestIdleCallback if available, otherwise use setTimeout
    if ("requestIdleCallback" in window) {
      const idleCallbackId = requestIdleCallback(handleIdleProcessing)
      return () => cancelIdleCallback(idleCallbackId)
    } else {
      const timeoutId = setTimeout(handleIdleProcessing, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [])

  // Add this to the window object to track intervals
  useEffect(() => {
    if (typeof window !== "undefined") {
      window._intervals = window._intervals || []
      const originalSetInterval = window.setInterval
      window.setInterval = (callback, delay) => {
        const id = originalSetInterval(callback, delay)
        window._intervals.push(id)
        return id
      }
    }
  }, [])

  // Get border color based on active tab
  const getBorderColorValue = () => {
    if (activeTab === "home") return isDark ? "#1e293b" /* gray-800 */ : "#ffffff" /* white */
    if (activeTab === "analyze") return isDark ? "rgba(255, 64, 129, 0.8)" /* #FF4081/80 */ : "#FF4081"
    if (activeTab === "duplicates") return isDark ? "rgba(0, 184, 212, 0.8)" /* #00b8d4/80 */ : "#00b8d4"
    if (activeTab === "bigfiles") return isDark ? "#059669" /* green-600 */ : "#10b981" /* green-500 */
    if (activeTab === "organize") return isDark ? "#9333ea" /* purple-600 */ : "#8b5cf6" /* purple-500 */
    return isDark ? "#1e293b" : "#ffffff"
  }

  // User menu toggle
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen)
  }

  return (
    <div className="flex flex-col h-screen dark:bg-gray-900 overflow-hidden disk-dominator-container">
      {/* Table-based layout for navigation header */}
      <div className="w-full" style={{ display: "table", tableLayout: "fixed", borderCollapse: "collapse" }}>
        <div style={{ display: "table-row" }}>
          {/* Logo and title */}
          <div
            style={{
              display: "table-cell",
              backgroundColor: "#2563eb", // bg-blue-600
              color: "white",
              verticalAlign: "middle",
              width: "220px",
              padding: "0.5rem 1rem",
            }}
          >
            <div className="flex items-center">
              <HardDrive size={24} />
              <h1 className="ml-3 text-xl font-semibold whitespace-nowrap">Disk Dominator</h1>
            </div>
          </div>

          {/* Main tabs container */}
          <div
            style={{
              display: "table-cell",
              backgroundColor: "#2563eb", // bg-blue-600
              color: "white",
              verticalAlign: "bottom",
              padding: "0",
              width: "auto",
            }}
          >
            <div className="flex">
              <TabNavigation tabs={mainTabs} activeTab={activeTab} setActiveTab={setActiveTab} type="main" />
              {/* Separator after main tabs */}
              <div className="h-8 self-center mx-2 border-l-2 border-blue-400 dark:border-blue-600"></div>
            </div>
          </div>

          {/* Secondary tabs container */}
          <div
            style={{
              display: "table-cell",
              backgroundColor: "#2563eb", // bg-blue-600
              color: "white",
              verticalAlign: "bottom",
              padding: "0",
              width: "100%", // Make this cell take available space
              textAlign: "center", // Center the content
            }}
          >
            <div className="flex items-center justify-center w-full">
              <TabNavigation
                tabs={secondaryTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                type="secondary"
                collapsed={false} // Set to true when tabs should be collapsed
              />
            </div>
          </div>

          {/* User actions */}
          <div
            style={{
              display: "table-cell",
              backgroundColor: "#2563eb", // bg-blue-600
              color: "white",
              verticalAlign: "middle",
              width: "200px", // Reduced width since we removed the AI button
              padding: "0.5rem 1rem",
              textAlign: "right",
            }}
          >
            <div className="flex items-center justify-end">
              <UserProfileButton userName="Lautaro" onClick={toggleUserMenu} />
              <UserMenu
                userName="Lautaro"
                userEmail="lautaro@ejemplo.com"
                credits={100}
                menuOpen={userMenuOpen}
                onClose={() => setUserMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content area with colored border */}
      <div
        className="flex-1 overflow-hidden transition-colors duration-300"
        style={{
          borderWidth: "4px",
          borderStyle: "solid",
          borderColor: getBorderColorValue(),
          backgroundColor: isDark ? "#0f172a" : "white", // Use dark background in dark mode
          marginTop: "-1px", // Eliminates space between tabs and content
          position: "relative",
          zIndex: 5,
        }}
      >
        <div className="h-full overflow-auto">
          {activeTab === "home" && <HomeView />}
          {activeTab === "analyze" && <DiskStatusView />}
          {activeTab === "duplicates" && <DuplicatesView />}
          {activeTab === "bigfiles" && <BigFilesView />}
          {activeTab === "organize" && <OrganizeView />}
        </div>
      </div>
    </div>
  )
}
