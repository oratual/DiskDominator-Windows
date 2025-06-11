import React from "react";
import React from "react";
import React from "react";
"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronRight } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { AIAssistantContext } from "../../disk-dominator-v2-fixed"
import type { DiskStatus, AIMessage } from "./types"
import { DiskStatusMessage } from "./components/disk-status-message"
import { AIAssistant } from "./components/ai-assistant"
import { ScanTypesInfo } from "./components/scan-types-info"
import { DiskCard } from "./components/disk-card"
import { ExcludeModal } from "./components/exclude-modal"

// Sample data - in a real app, this would come from an API or context
const initialDisks: DiskStatus[] = [
  {
    id: "disk1",
    name: "Disco Local (C:)",
    status: "scanning", // This disk is actively scanning
    scanType: "quick",
    progress: 65,
    quickScanProgress: 65,
    slowScanProgress: 0,
    canAnalyzeDuplicates: true,
    canOrganize: false,
    estimatedTimeRemaining: 120, // 2 minutes
    size: "500 GB",
    used: "325 GB",
    free: "175 GB",
    isPaused: false, // Explicitly set to false to ensure it's recognized as active
  },
  {
    id: "disk2",
    name: "Datos (D:)",
    status: "complete",
    scanType: null,
    progress: 100,
    quickScanProgress: 100,
    slowScanProgress: 100,
    canAnalyzeDuplicates: true,
    canOrganize: true,
    size: "1 TB",
    used: "750 GB",
    free: "250 GB",
  },
  {
    id: "disk3",
    name: "Multimedia (E:)",
    status: "complete", // Changed from "pending" to "complete" for testing
    scanType: null,
    progress: 100, // Changed from 0 to 100
    quickScanProgress: 100, // Changed from 0 to 100
    slowScanProgress: 100, // Changed from 0 to 100
    canAnalyzeDuplicates: true, // Changed from false to true
    canOrganize: true, // Changed from false to true
    size: "2 TB",
    used: "1.2 TB",
    free: "800 GB",
  },
  {
    id: "disk4",
    name: "Backup (F:)",
    status: "error",
    scanType: null,
    progress: 23,
    quickScanProgress: 23,
    slowScanProgress: 0,
    canAnalyzeDuplicates: false,
    canOrganize: false,
    size: "4 TB",
    used: "3.5 TB",
    free: "500 GB",
  },
  {
    id: "disk5",
    name: "External Drive (G:)",
    status: "pending",
    scanType: null,
    progress: 0,
    quickScanProgress: 0,
    slowScanProgress: 0,
    canAnalyzeDuplicates: false,
    canOrganize: false,
    size: "1 TB",
    used: "200 GB",
    free: "800 GB",
  },
  {
    id: "disk6",
    name: "Network Drive (Z:)",
    status: "pending",
    scanType: null,
    progress: 0,
    quickScanProgress: 0,
    slowScanProgress: 0,
    canAnalyzeDuplicates: false,
    canOrganize: false,
    size: "8 TB",
    used: "5.3 TB",
    free: "2.7 TB",
  },
  {
    id: "disk7",
    name: "USB Drive (H:)",
    status: "pending",
    scanType: null,
    progress: 0,
    quickScanProgress: 0,
    slowScanProgress: 0,
    canAnalyzeDuplicates: false,
    canOrganize: false,
    size: "128 GB",
    used: "85 GB",
    free: "43 GB",
  },
]

export default function DiskStatusView() {
  const [disks, setDisks] = useState<DiskStatus[]>(initialDisks)
  const [showExcludeModal, setShowExcludeModal] = useState(false)
  const [excludedPaths, setExcludedPaths] = useState<string[]>([])
  const [tempExcludedPaths, setTempExcludedPaths] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Debug logging to verify scanning state
  useEffect(() => {
    console.log("Current disks state:", disks)
  }, [disks])

  const handleExcludeSelection = (paths: string[]) => {
    if (JSON.stringify(paths) !== JSON.stringify(tempExcludedPaths)) {
      setTempExcludedPaths(paths)
    }
  }

  const saveExclusions = () => {
    setExcludedPaths(tempExcludedPaths)
    setShowExcludeModal(false)
  }

  const startScan = (diskId: string, scanType: "quick" | "slow") => {
    setDisks((prevDisks) =>
      prevDisks.map((disk) => {
        if (disk.id === diskId) {
          return {
            ...disk,
            status: "scanning",
            scanType,
            progress: 0,
            quickScanProgress: 0,
            slowScanProgress: 0,
            estimatedTimeRemaining: scanType === "quick" ? 120 : 300,
            isPaused: false, // Explicitly set to false when starting a scan
          }
        }
        return disk
      }),
    )
  }

  const togglePauseScan = (diskId: string) => {
    setDisks((prevDisks) =>
      prevDisks.map((disk) => {
        if (disk.id === diskId) {
          const isPaused = !disk.isPaused
          return {
            ...disk,
            isPaused,
            status: isPaused ? "paused" : "scanning",
          }
        }
        return disk
      }),
    )
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setDisks((prevDisks) =>
        prevDisks.map((disk) => {
          if (disk.isPaused) return disk

          if (disk.status === "scanning") {
            if (disk.scanType === "quick" && (disk.quickScanProgress || 0) < 100) {
              const newQuickProgress = Math.min((disk.quickScanProgress || 0) + 1, 100)
              const newTimeRemaining = disk.estimatedTimeRemaining ? Math.max(0, disk.estimatedTimeRemaining - 1) : 0

              let canAnalyzeDuplicates = disk.canAnalyzeDuplicates

              if (newQuickProgress >= 40 && !canAnalyzeDuplicates) {
                canAnalyzeDuplicates = true
              }

              if (newQuickProgress === 100) {
                return {
                  ...disk,
                  status: "scanning",
                  scanType: "slow",
                  quickScanProgress: 100,
                  slowScanProgress: 0,
                  canAnalyzeDuplicates: true,
                  canOrganize: false,
                  estimatedTimeRemaining: 300,
                  isPaused: false, // Ensure it's not paused
                }
              }

              return {
                ...disk,
                quickScanProgress: newQuickProgress,
                progress: newQuickProgress,
                canAnalyzeDuplicates,
                estimatedTimeRemaining: newTimeRemaining,
                isPaused: false, // Ensure it's not paused
              }
            } else if (disk.scanType === "slow" && (disk.slowScanProgress || 0) < 100) {
              const newSlowProgress = Math.min((disk.slowScanProgress || 0) + 0.5, 100)
              const newTimeRemaining = disk.estimatedTimeRemaining ? Math.max(0, disk.estimatedTimeRemaining - 1) : 0

              let canOrganize = disk.canOrganize

              if (newSlowProgress >= 80 && !canOrganize) {
                canOrganize = true
              }

              if (newSlowProgress === 100) {
                return {
                  ...disk,
                  status: "complete",
                  quickScanProgress: 100,
                  slowScanProgress: 100,
                  progress: 100,
                  canAnalyzeDuplicates: true,
                  canOrganize: true,
                  estimatedTimeRemaining: 0,
                }
              }

              return {
                ...disk,
                slowScanProgress: newSlowProgress,
                progress: newSlowProgress,
                canOrganize,
                estimatedTimeRemaining: newTimeRemaining,
                isPaused: false, // Ensure it's not paused
              }
            }
          }
          return disk
        }),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Add this function inside the DiskStatusView component, after the existing state declarations
  // This will ensure the component respects the readability settings
  useEffect(() => {
    // Apply readability classes to the component container
    const applyReadabilitySettings = () => {
      const container = document.querySelector(".disk-status-container")
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

  // AI Assistant states
  const [chatWidth, setChatWidth] = useState(300)
  const [isResizingChat, setIsResizingChat] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const chatResizeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      role: "assistant",
      content: "¡Bienvenido al Analizador de Discos! ¿En qué puedo ayudarte hoy?",
    },
    {
      role: "assistant",
      content:
        "Puedo ayudarte a entender los resultados del análisis o explicarte cómo funcionan los diferentes tipos de escaneo.",
    },
  ])
  const [userInput, setUserInput] = useState("")

  // Add these functions before the return statement
  const openAIAssistant = () => {
    if (chatCollapsed) {
      setChatCollapsed(false)
    }
  }

  const focusAIInput = () => {
    if (!chatCollapsed && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [aiMessages])

  // Function to handle sending a message
  const handleSendMessage = () => {
    if (!userInput.trim()) return

    // Add user message
    setAiMessages([...aiMessages, { role: "user", content: userInput }])

    // Clear input
    setUserInput("")

    // Simulate AI response after a delay
    setTimeout(() => {
      let response = ""

      if (userInput.toLowerCase().includes("analizar") || userInput.toLowerCase().includes("escanear")) {
        response =
          "Para analizar tus discos, selecciona el botón 'Escanear' en cualquiera de las tarjetas de disco que aparecen en esta pantalla."
      } else if (userInput.toLowerCase().includes("duplicados")) {
        response =
          "Los duplicados son archivos idénticos que ocupan espacio innecesario. Una vez que el escaneo rápido esté completo, podrás ver todos los duplicados en la pestaña 'Duplicados'."
      } else if (userInput.toLowerCase().includes("espacio") || userInput.toLowerCase().includes("liberar")) {
        response =
          "Para liberar espacio, puedes eliminar archivos duplicados o revisar los archivos grandes en la pestaña 'Archivos Gigantes' una vez que el escaneo esté completo."
      } else {
        response =
          "Estoy aquí para ayudarte con el análisis de tus discos. ¿Quieres saber más sobre los tipos de escaneo, cómo interpretar los resultados o cómo excluir carpetas del análisis?"
      }

      setAiMessages((prev) => [...prev, { role: "assistant", content: response }])
    }, 1000)
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

  return (
    <AIAssistantContext.Provider value={{ openAIAssistant, focusAIInput }}>
      <div ref={containerRef} className="flex flex-1 h-full overflow-hidden dark:bg-gray-900 dark:text-white">
        {/* Left Panel - Chat with AI */}
        <AIAssistant
          chatWidth={chatWidth}
          chatCollapsed={chatCollapsed}
          setChatCollapsed={setChatCollapsed}
          isResizingChat={isResizingChat}
          setIsResizingChat={setIsResizingChat}
          aiMessages={aiMessages}
          setAiMessages={setAiMessages}
          userInput={userInput}
          setUserInput={setUserInput}
          inputRef={inputRef}
          messagesEndRef={messagesEndRef}
          handleSendMessage={handleSendMessage}
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

        {/* Main Content */}
        <div className="p-6 h-full overflow-auto dark:bg-gray-900 dark:text-white disk-status-container flex-1">
          {/* Title removed as requested */}
          <div className="mb-5"></div>

          <DiskStatusMessage disks={disks} />

          <ScanTypesInfo
            onShowExcludeModal={() => {
              setTempExcludedPaths(excludedPaths)
              setShowExcludeModal(true)
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 divide-y divide-gray-300 dark:divide-gray-700">
            {disks.map((disk) => (
              <DiskCard key={disk.id} disk={disk} startScan={startScan} togglePauseScan={togglePauseScan} />
            ))}
          </div>

          <ExcludeModal
            showExcludeModal={showExcludeModal}
            setShowExcludeModal={setShowExcludeModal}
            handleExcludeSelection={handleExcludeSelection}
            saveExclusions={saveExclusions}
          />
        </div>

        {/* Mobile toggle button */}
        {isMobile && (
          <button
            className="fixed bottom-4 left-4 z-50 p-2 bg-blue-500 text-white rounded-full shadow-lg"
            onClick={() => setChatCollapsed(!chatCollapsed)}
          >
            {!chatCollapsed ? (
              <ChevronLeftIcon size={20} className="text-white" />
            ) : (
              <ChevronRight size={20} className="text-white" />
            )}
          </button>
        )}
      </div>
    </AIAssistantContext.Provider>
  )
}

// Custom ChevronLeft component
const ChevronLeftIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
)
