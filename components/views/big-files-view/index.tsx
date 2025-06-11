import React from "react";
import React from "react";
"use client"

import { useState, useRef, useEffect } from "react"
import { HelpCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AIAssistant } from "./components/ai-assistant"
import { FileSidebar } from "./components/file-sidebar"
import { FileListView } from "./components/file-list-view"
import { FileExplorerView } from "./components/file-explorer-view"
import { largeFiles, availableDisks } from "./utils"
import type { FileItem } from "./types"

export default function BigFilesView() {
  // Main state
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [selectedView, setSelectedView] = useState("list")
  const [selectedType, setSelectedType] = useState("all")
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [minFileSize, setMinFileSize] = useState("1gb")
  const [sortBy, setSortBy] = useState("size")
  const [sortDirection, setSortDirection] = useState("desc")
  const [currentPath, setCurrentPath] = useState("C:/")
  const [chatExpanded, setChatExpanded] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeDisk, setActiveDisk] = useState("all")
  const [showStats, setShowStats] = useState(true)

  // Size slider state
  const [minSizeThumb, setMinSizeThumb] = useState(20) // Posición en porcentaje (0-100)
  const [maxSizeThumb, setMaxSizeThumb] = useState(80) // Posición en porcentaje (0-100)

  // Disk selection state
  const [selectedDisks, setSelectedDisks] = useState<string[]>(["C", "D", "E", "J"])

  // AI Assistant states
  const [chatWidth, setChatWidth] = useState(300)
  const [isResizingChat, setIsResizingChat] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const chatResizeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Show file preview
  const openPreview = (file: FileItem) => {
    setPreviewItem(file)
    setShowPreview(true)
  }

  // AI Assistant resize handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingChat || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - containerRect.left
      const maxWidth = containerRect.width * 0.7 // Máximo 70% del ancho total

      if (newWidth >= 200 && newWidth <= maxWidth) {
        setChatWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizingChat(false)
      document.body.style.cursor = "default"
      document.body.style.userSelect = "auto"
    }

    if (isResizingChat) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizingChat])

  const startResizingChat = () => {
    if (chatCollapsed) return
    setIsResizingChat(true)
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
  }

  // Apply readability settings
  useEffect(() => {
    // Apply readability classes to the component container
    const applyReadabilitySettings = () => {
      const container = document.querySelector(".big-files-container")
      if (container) {
        // Check if enhanced readability is enabled
        if (document.documentElement.classList.contains("enhanced-readability")) {
          container.classList.add("readability-enhanced")
        } else {
          container.classList.remove("readability-enhanced")
        }

        // Check if high contrast is enabled
        if (document.documentElement.classList.contains("high-contrast")) {
          container.classList.add("high-contrast-content")
        } else {
          container.classList.remove("high-contrast-content")
        }

        // Check if wide spacing is enabled
        if (document.documentElement.classList.contains("wide-spacing")) {
          container.classList.add("wide-spacing-content")
        } else {
          container.classList.remove("wide-spacing-content")
        }
      }
    }

    // Apply settings initially
    applyReadabilitySettings()

    // Set up observer to detect changes to document element classes
    const observer = new MutationObserver(applyReadabilitySettings)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex flex-1 h-full overflow-hidden dark:bg-gray-900 dark:text-white big-files-container"
    >
      {/* Left Panel - Chat with AI */}
      <AIAssistant
        chatWidth={chatWidth}
        chatCollapsed={chatCollapsed}
        setChatCollapsed={setChatCollapsed}
        isResizingChat={isResizingChat}
        startResizingChat={startResizingChat}
      />

      {/* Divisor redimensionable para el chat */}
      <div
        ref={chatResizeRef}
        className={`relative w-px bg-gray-200 ${chatCollapsed ? "cursor-default" : "cursor-ew-resize"} flex-shrink-0 transition-colors dark:bg-gray-700`}
        onMouseDown={startResizingChat}
      >
        <div className="absolute inset-0 w-px bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"></div>
        {/* Área ampliada para mouseOver, invisible pero interactiva */}
        <div className="absolute inset-y-0 -left-2 -right-2"></div>
      </div>

      {/* Left Panel - Options */}
      <FileSidebar
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        selectedDisks={selectedDisks}
        setSelectedDisks={setSelectedDisks}
        availableDisks={availableDisks}
        minSizeThumb={minSizeThumb}
        maxSizeThumb={maxSizeThumb}
        setMinSizeThumb={setMinSizeThumb}
        setMaxSizeThumb={setMaxSizeThumb}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
      />

      {/* Right Content - File List and Explorer */}
      <div className="flex-1 flex flex-col h-full">
        {/* Action Bar */}
        <div className="bg-white dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-lg font-medium">Archivos y carpetas de gran tamaño</h2>
            <span className="ml-3 text-sm text-gray-500 dark:text-gray-300">
              {largeFiles.length} elementos • {formatSize(largeFiles.reduce((total, file) => total + file.size, 0))}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" className="flex items-center">
              <Zap size={16} className="mr-2" />
              Sugerencias de la IA
            </Button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-6 min-h-0">
          {/* List View */}
          {selectedView === "list" && <FileListView files={largeFiles} openPreview={openPreview} />}

          {/* Explorer View */}
          {selectedView === "explorer" && <FileExplorerView files={largeFiles} openPreview={openPreview} />}
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between sticky bottom-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-300">
              Archivos mostrados: <span className="font-medium">{largeFiles.length}</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" className="flex items-center">
              <HelpCircle size={16} className="mr-2" />
              Ayuda
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function for formatting size
function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B"
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  else if (bytes < 1024 * 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  else return (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2) + " TB"
}
