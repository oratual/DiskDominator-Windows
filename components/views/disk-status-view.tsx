import React from "react";
import React from "react";
import React from "react";
import React from "react";
"use client"

import { useState, useEffect, useRef } from "react"
import {
  HardDrive,
  Check,
  AlertCircle,
  Zap,
  Pause,
  Play,
  X,
  FolderMinus,
  Save,
  Info,
  FileText,
  Copy,
  LayoutGrid,
  ChevronRight,
  MessageSquare,
  ArrowRight,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import FileExplorer from "@/components/file-explorer"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"
// Add this import at the top
import { AIAssistantContext } from "../disk-dominator-v2-fixed"

// Color associations for features
const FEATURE_COLORS = {
  duplicates: "blue",
  largeFiles: "green",
  organize: "purple",
}

// Types for our disk data
interface DiskStatus {
  id: string
  name: string
  status: "scanning" | "pending" | "complete" | "error" | "paused"
  scanType: "quick" | "slow" | null
  progress: number
  quickScanProgress?: number
  slowScanProgress?: number
  canAnalyzeDuplicates: boolean
  canOrganize: boolean
  estimatedTimeRemaining?: number // in seconds
  size: string
  used: string
  free: string
  isPaused?: boolean
}

// Update the getDiskScanningState function to also check for completed disks
function getDiskScanningState(disks: DiskStatus[]) {
  // Check if any disk is in scanning state and not paused
  const hasQuickScanning = disks.some((d) => d.status === "scanning" && d.scanType === "quick" && !d.isPaused)
  const hasSlowScanning = disks.some((d) => d.status === "scanning" && d.scanType === "slow" && !d.isPaused)
  // Check if any disk is paused
  const hasPausedScanning = disks.some((d) => (d.status === "scanning" || d.status === "paused") && d.isPaused)
  // Check if all disks have completed their scans
  const allCompleted = disks.length > 0 && disks.every((d) => d.status === "complete")

  if (allCompleted) return "completed"
  if (hasPausedScanning) return "paused"
  if (hasQuickScanning) return "quick-scanning"
  if (hasSlowScanning) return "idle"
}

// Update the DiskStatusMessage component to handle the completed state
function DiskStatusMessage({ disks }: { disks: DiskStatus[] }) {
  // Calculate disk status
  const disksWithQuickScanComplete = disks.filter((d) => (d.quickScanProgress || 0) === 100)
  const disksWithFullScanComplete = disks.filter((d) => (d.slowScanProgress || 0) === 100)
  const pausedDisks = disks.filter((d) => (d.status === "scanning" || d.status === "paused") && d.isPaused)

  // Determine the scanning state for animation
  const scanningState = getDiskScanningState(disks)
  console.log("Current scanning state:", scanningState) // Debug logging

  // Helper function for singular/plural text
  const formatSingularPlural = (count: number, singularText: string, pluralText: string) => {
    return count === 1 ? singularText : pluralText
  }

  // Determine which message to show
  let message = ""
  let iconColor = "text-blue-500"

  // Set icon color based on scanning state
  if (scanningState === "paused") {
    iconColor = "text-red-500"
  } else if (scanningState === "quick-scanning") {
    iconColor = "text-green-500"
  } else if (scanningState === "slow-scanning") {
    iconColor = "text-purple-500"
  } else if (scanningState === "completed") {
    iconColor = "text-black"
  }

  let icon = <Info className={`h-6 w-6 ${iconColor}`} />

  // Case 1: No disks have been scanned
  if (disksWithQuickScanComplete.length === 0) {
    const diskText = formatSingularPlural(disks.length, "el disco se escanee", "los discos se escaneen")
    message = `Espera a que ${diskText}. Aquí te iré avisando cuando ${disks.length === 1 ? "esté listo" : "estén listos"}.`
  }
  // Case 2: Some disks have completed quick scan but not all
  else if (disksWithQuickScanComplete.length > 0 && disksWithQuickScanComplete.length < disks.length) {
    const diskNames = disksWithQuickScanComplete.map((d) => d.name).join(", ")
    const diskText = disksWithQuickScanComplete.length === 1 ? "el disco" : "los discos"
    message = `Puedes usar las funciones de "Duplicados" y "Archivos Gigantes" en ${diskText} que ha${disksWithQuickScanComplete.length === 1 ? "" : "n"} completado el escaneo rápido (${diskNames}). Puedes ir echándole un vistazo a los archivos gigantes mientras termina${disks.length - disksWithQuickScanComplete.length === 1 ? "" : "n"} ${disks.length - disksWithQuickScanComplete.length === 1 ? "el otro disco" : "los demás discos"}.`
    icon = <FileText className={`h-6 w-6 ${iconColor}`} />
  }
  // Case 3: All disks have completed quick scan but none have completed full scan
  else if (disksWithQuickScanComplete.length === disks.length && disksWithFullScanComplete.length === 0) {
    const diskText = formatSingularPlural(disks.length, "el disco", "todos los discos")
    message = `Ya puedes usar las funciones de "Duplicados" y "Archivos Gigantes" en ${diskText}. Cuando termine${disks.length === 1 ? "" : "n"} el escaneo completo podrás usar "Ordenar Disco". Te avisaré cuando suceda.`
    icon = <Copy className={`h-6 w-6 ${iconColor}`} />
  }
  // Case 4: All completed quick scan and some completed full scan
  else if (
    disksWithQuickScanComplete.length === disks.length &&
    disksWithFullScanComplete.length > 0 &&
    disksWithFullScanComplete.length < disks.length
  ) {
    const organizeDisks = disksWithFullScanComplete.map((d) => d.name).join(", ")
    const fullScanText =
      disksWithFullScanComplete.length === 1
        ? `el disco: ${organizeDisks}, que ha completado`
        : `los discos: ${organizeDisks}, que han completado`
    message = `Ya puedes usar "Duplicados" y "Archivos Gigantes" en todos los discos y puedes empezar a ordenar ${fullScanText} el escaneo completo.`
    icon = <LayoutGrid className={`h-6 w-6 ${iconColor}`} />
  }
  // Case 5: Some disks have completed quick scan and some have completed full scan (but not all have quick)
  else if (
    disksWithQuickScanComplete.length > 0 &&
    disksWithQuickScanComplete.length < disks.length &&
    disksWithFullScanComplete.length > 0
  ) {
    const quickDisks = disksWithQuickScanComplete.map((d) => d.name).join(", ")
    const quickText = disksWithQuickScanComplete.length === 1 ? `el disco ${quickDisks}` : `los discos ${quickDisks}`

    const fullDisks = disksWithFullScanComplete.map((d) => d.name).join(", ")
    const fullText =
      disksWithFullScanComplete.length === 1
        ? `el disco ${fullDisks}, que ha terminado`
        : `los discos ${fullDisks}, que han terminado`

    message = `Ya puedes usar "Duplicados" y "Archivos Gigantes" en ${quickText} y puedes empezar a ordenar ${fullText} el escaneo completo.`
    icon = <LayoutGrid className={`h-6 w-6 ${iconColor}`} />
  }
  // Case 6: All disks have completed all scans
  else if (disksWithFullScanComplete.length === disks.length) {
    const diskText = formatSingularPlural(disks.length, "el disco", "todos los discos")
    message = `¡Enhorabuena! Ya puedes usar todas las pestañas: "Duplicados", "Archivos Gigantes" y "Ordenar Disco" en ${diskText}.`
    icon = <Check className={`h-6 w-6 ${iconColor}`} />
  }

  // If there are paused disks, add a message about them
  if (pausedDisks.length > 0) {
    const pausedDiskNames = pausedDisks.map((d) => d.name).join(", ")
    const pausedText =
      pausedDisks.length === 1
        ? `El escaneo de ${pausedDiskNames} está pausado. Reanúdalo para continuar.`
        : `El escaneo de ${pausedDiskNames} está pausado. Reanúdalos para continuar.`

    // If there's already a message, append to it, otherwise set it
    if (message) {
      message = `${message} ${pausedText}`
    } else {
      message = pausedText
    }

    // Update icon for paused state
    icon = <Pause className={`h-6 w-6 text-red-500`} />
  }

  // Determine animation class based on scanning state
  let animationClass = ""
  if (scanningState === "quick-scanning") {
    animationClass = "construction-animation-quick"
  } else if (scanningState === "slow-scanning") {
    animationClass = "construction-animation-slow"
  } else if (scanningState === "completed") {
    animationClass = "confetti-animation"
  }

  // Always show the border when a scan is in progress, paused, or completed
  const showBorder = scanningState !== "idle"

  // Determine status indicator color and text
  let statusIndicatorBg = "bg-green-100"
  let statusIndicatorText = "text-green-800"
  let statusIndicatorIcon = <Zap className="h-4 w-4 mr-1" />
  let statusText = "Escaneo para Duplicados y Archivos Gigantes en progreso"

  if (scanningState === "paused") {
    statusIndicatorBg = "bg-red-100"
    statusIndicatorText = "text-red-800"
    statusIndicatorIcon = <Pause className="h-4 w-4 mr-1" />
    statusText = "Escaneo Pausado"
  } else if (scanningState === "slow-scanning") {
    statusIndicatorBg = "bg-purple-100"
    statusIndicatorText = "text-purple-800"
    statusIndicatorIcon = <HardDrive className="h-4 w-4 mr-1" />
    statusText = "Escaneo para Ordenar Discos en progreso"
  } else if (scanningState === "completed") {
    statusIndicatorBg = "bg-gray-100"
    statusIndicatorText = "text-black"
    statusIndicatorIcon = <Check className="h-4 w-4 mr-1" />
    statusText = "Escaneo Terminado"
  } else if (disksWithFullScanComplete.length === disks.length) {
    statusIndicatorBg = "bg-purple-100"
    statusIndicatorText = "text-purple-800"
    statusIndicatorIcon = <Check className="h-4 w-4 mr-1" />
    statusText = "Todos los escaneos completados"
  }

  // Debug logging
  console.log(
    "Scanning disks:",
    disks.filter((d) => d.status === "scanning" && !d.isPaused),
  )
  console.log("Animation class:", animationClass)
  console.log("Show border:", showBorder)

  return (
    <div
      className={`mb-6 rounded-lg ${
        showBorder ? animationClass : "border-3 border-gray-200"
      } bg-white shadow-md relative status-message-box dark:bg-gray-800 dark:border-gray-700`}
      style={{
        // Force the animation to be visible with inline styles if needed
        ...(showBorder && {
          position: "relative",
          zIndex: 1,
        }),
      }}
    >
      <div className="p-5 flex items-start">
        <div className="bg-white p-3 rounded-full mr-4 flex-shrink-0 shadow-sm dark:bg-gray-700">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-semibold text-black dark:text-white">Análisis de los Discos</h3>
            {/* Status indicator positioned closer to the label */}
            {scanningState !== "idle" || disksWithFullScanComplete.length === disks.length ? (
              <span
                className={`text-sm ${statusIndicatorBg} ${statusIndicatorText} px-3 py-1 rounded-full font-normal flex items-center ml-3 dark:bg-opacity-20`}
              >
                {statusIndicatorIcon}
                {statusText}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-black dark:text-gray-200">{message}</p>
        </div>
      </div>

      {/* Construction-themed decorative elements */}
      {showBorder && scanningState !== "completed" && (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div
            className={`construction-corner ${scanningState === "slow-scanning" ? "construction-corner-purple" : scanningState === "paused" ? "construction-corner-red" : ""}`}
          ></div>
        </div>
      )}
    </div>
  )
}

// Remove the scanning indicator from the main title section
export default function DiskStatusView() {
  // Sample data - in a real app, this would come from an API or context
  const [disks, setDisks] = useState<DiskStatus[]>([
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
  ])

  // Debug logging to verify scanning state
  useEffect(() => {
    console.log("Current disks state:", disks)
    console.log("Scanning state:", getDiskScanningState(disks))
  }, [disks])

  const [showExcludeModal, setShowExcludeModal] = useState(false)
  const [excludedPaths, setExcludedPaths] = useState<string[]>([])
  const [tempExcludedPaths, setTempExcludedPaths] = useState<string[]>([])
  // Add these refs after the other useRef declarations
  const inputRef = useRef<HTMLInputElement>(null)

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

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return "Completado"

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes === 0) {
      return `${remainingSeconds}s restantes`
    }

    return `${minutes}m ${remainingSeconds}s restantes`
  }

  const getStatusText = (status: string, isPaused?: boolean): string => {
    if (isPaused) return "Pausado"

    switch (status) {
      case "scanning":
        return "Escaneando"
      case "complete":
        return "Completado"
      case "error":
        return "Error"
      case "paused":
        return "Pausado"
      default:
        return "Pendiente"
    }
  }

  const getStatusColor = (status: string, scanType: "quick" | "slow" | null = null, isPaused?: boolean): string => {
    if (isPaused) return "text-orange-600"

    switch (status) {
      case "scanning":
        return scanType === "quick" ? `text-${FEATURE_COLORS.largeFiles}-500` : `text-${FEATURE_COLORS.organize}-500`
      case "complete":
        return "text-green-500"
      case "error":
        return "text-red-500"
      case "paused":
        return "text-orange-600"
      default:
        return "text-gray-500"
    }
  }

  const getProgressColor = (status: string, scanType: "quick" | "slow" | null = null, isPaused?: boolean): string => {
    if (isPaused) return "bg-orange-600"

    switch (status) {
      case "scanning":
        return scanType === "quick" ? `bg-${FEATURE_COLORS.largeFiles}-500` : `bg-${FEATURE_COLORS.organize}-500`
      case "complete":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      case "paused":
        return "bg-orange-600"
      default:
        return "bg-gray-300"
    }
  }

  const getStatusIcon = (status: string, scanType: "quick" | "slow" | null = null, isPaused?: boolean) => {
    if (isPaused) {
      return <Pause className="h-5 w-5 text-orange-600" />
    }

    switch (status) {
      case "scanning":
        return scanType === "quick" ? (
          <Zap className={`h-5 w-5 text-${FEATURE_COLORS.largeFiles}-500`} />
        ) : (
          <HardDrive className={`h-5 w-5 text-${FEATURE_COLORS.organize}-500`} />
        )
      case "complete":
        return <Check className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "paused":
        return <Pause className="h-5 w-5 text-orange-600" />
      default:
        return <HardDrive className="h-5 w-5 text-gray-500" />
    }
  }

  const getScanTypeText = (scanType: "quick" | "slow" | null): string => {
    if (!scanType) return ""
    return scanType === "quick" ? "Escaneo para Duplicados y Archivos Gigantes" : "Escaneo para Ordenar Discos"
  }

  const FileExplorerWithCheckboxes = FileExplorer

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

  // AI Assistant states - copied from home-view.tsx
  const [chatWidth, setChatWidth] = useState(300)
  const [isResizingChat, setIsResizingChat] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const chatResizeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  const [aiMessages, setAiMessages] = useState([
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

  // Modify the return statement to wrap everything in the context provider
  // Replace the first line of the return statement:
  return (
    <AIAssistantContext.Provider value={{ openAIAssistant, focusAIInput }}>
      <div ref={containerRef} className="flex flex-1 h-full overflow-hidden dark:bg-gray-900 dark:text-white">
        {/* Left Panel - Chat with AI */}
        <div
          ref={chatRef}
          className="flex flex-col border-r border-gray-200 bg-white relative dark:bg-gray-800 dark:border-gray-700"
          style={{
            width: chatCollapsed ? "40px" : `${chatWidth}px`,
            minWidth: chatCollapsed ? "40px" : "200px",
            maxWidth: chatCollapsed ? "40px" : "70%",
          }}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {!chatCollapsed ? (
              <>
                <div className="flex items-center">
                  <MessageSquare size={18} className="mr-2" />
                  <h2 className="font-medium">AI Assistant</h2>
                </div>
                <button
                  onClick={() => {
                    setChatCollapsed(true)
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeftIcon size={20} className="text-gray-500 hover:text-gray-700" />
                </button>
              </>
            ) : (
              <div className="w-full flex justify-center">
                <button
                  onClick={() => setChatCollapsed(false)}
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          {chatCollapsed ? (
            <div className="flex-1 flex items-center justify-center">
              <span
                className="font-medium text-white whitespace-nowrap"
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%) rotate(90deg)",
                  transformOrigin: "center",
                  width: "max-content",
                }}
              >
                AI Assistant
              </span>
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {aiMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`rounded-lg p-3 max-w-xs ${
                        message.role === "user"
                          ? "bg-blue-100 dark:bg-blue-900/50 chat-message-user"
                          : "bg-gray-100 dark:bg-gray-700 chat-message-ai"
                      }`}
                    >
                      <p className={`text-sm ${message.role === "user" ? "dark:text-white" : "dark:text-gray-100"}`}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-2 chat-input">
                  {/* Add the ref to the Input component in the Chat Input section: */}
                  {/* Find the Input component and add the ref attribute: */}
                  <Input
                    type="text"
                    placeholder="Escribe tu instrucción aquí..."
                    className="flex-1 bg-transparent outline-none text-sm border-none dark:text-gray-100 dark:placeholder-gray-400"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    ref={inputRef}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage()
                      }
                    }}
                  />
                  <button className="ml-2 text-blue-600 dark:text-blue-400" onClick={handleSendMessage}>
                    <ArrowRight size={20} />
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Sugerencia: Pregúntame sobre los tipos de escaneo
                </div>
              </div>
            </>
          )}
        </div>

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

          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100 dark:bg-gray-800 dark:border-gray-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left section - Scan Types */}
              <div>
                <h3 className="font-medium text-blue-800 mb-2 dark:text-blue-300">Tipos de Escaneo</h3>
                <div className="space-y-4">
                  <div className="flex">
                    <div className={`bg-${FEATURE_COLORS.largeFiles}-100 p-2 rounded-full h-min dark:bg-green-900`}>
                      <Zap className={`h-5 w-5 text-${FEATURE_COLORS.largeFiles}-500 dark:text-green-300`} />
                    </div>
                    <div className="ml-3">
                      <h4 className={`font-medium text-${FEATURE_COLORS.largeFiles}-700 dark:text-green-300`}>
                        Escaneo para Duplicados y Archivos Gigantes
                      </h4>
                      <p className={`text-sm text-${FEATURE_COLORS.largeFiles}-600 max-w-md dark:text-green-200`}>
                        Habilita en pocos minutos el uso de las pestañas Duplicados y Archivos gigantes
                      </p>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="bg-purple-100 p-2 rounded-full h-min dark:bg-purple-900">
                      <HardDrive className="h-5 w-5 text-purple-500 dark:text-purple-300" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-purple-700 dark:text-purple-300">Escaneo para Ordenar Discos</h4>
                      <p className="text-sm text-purple-600 max-w-md dark:text-purple-200">
                        Habilita La pestaña Ordenar Disco, se ejecuta automáticamente después del primer escaneo. Puede
                        llegar a tardar horas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right section - Skip Scan */}
              <div>
                <h3 className="font-medium text-blue-800 mb-2 dark:text-blue-300">Privacidad y Control</h3>
                <div className="flex">
                  <div className="bg-yellow-100 p-2 rounded-full h-min dark:bg-yellow-900">
                    <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-300" />
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <h4 className="font-medium text-yellow-700 dark:text-yellow-300">Omitir del escaneo</h4>
                      <button
                        className="ml-2 px-3 py-1 text-xs bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors dark:bg-yellow-600 dark:hover:bg-yellow-700"
                        onClick={() => {
                          setTempExcludedPaths(excludedPaths)
                          setShowExcludeModal(true)
                        }}
                      >
                        Configurar
                      </button>
                    </div>
                    <p className="text-sm text-yellow-600 max-w-md mt-1 dark:text-yellow-200">
                      Indica qué discos o carpetas no quieres que sean escaneados. En ningún caso la IA tendrá acceso al
                      contenido de tus archivos, solo a tu{" "}
                      <span
                        className="underline cursor-pointer relative group"
                        onClick={(e) => {
                          const tooltip = e.currentTarget.querySelector(".metadata-tooltip")
                          if (tooltip) {
                            tooltip.classList.toggle("hidden")
                          }
                        }}
                      >
                        metadata
                        <span className="metadata-tooltip hidden absolute bottom-full left-1/2 transform -translate-x-1/2 w-64 bg-gray-800 text-white text-xs rounded p-2 mb-1 z-10">
                          La metadata incluye información como nombres de archivos, tamaños, fechas de creación y
                          modificación, pero no el contenido real de los archivos.
                          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></span>
                        </span>
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 divide-y divide-gray-300 dark:divide-gray-700">
            {disks.map((disk) => (
              <div
                key={disk.id}
                className="bg-white rounded-lg shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-md transition-shadow disk-card dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <HardDrive className="h-4 w-4 mr-1.5 text-gray-700 dark:text-gray-300" />
                      <h3 className="font-medium text-gray-900 text-sm dark:text-gray-100">{disk.name}</h3>
                    </div>
                    <div
                      className={cn("text-xs font-medium", getStatusColor(disk.status, disk.scanType, disk.isPaused))}
                    >
                      <div className="flex items-center">
                        {getStatusIcon(disk.status, disk.scanType, disk.isPaused)}
                        <span className="ml-1 dark:text-gray-200">{getStatusText(disk.status, disk.isPaused)}</span>
                      </div>
                    </div>
                  </div>

                  {disk.scanType && (
                    <div className="mb-1.5 text-xs text-gray-600 flex justify-between items-center dark:text-gray-300">
                      <span>{getScanTypeText(disk.scanType)}</span>
                      {disk.status === "scanning" && (
                        <span
                          className={
                            disk.isPaused
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-green-500 dark:text-green-400"
                          }
                        >
                          {disk.isPaused ? "Pausado" : "En progreso"}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mb-1.5">
                    <div className="flex justify-between text-xs text-gray-500 mb-0.5 dark:text-gray-300">
                      <span>
                        Escaneo para Duplicados y Archivos Gigantes: {Math.round(disk.quickScanProgress || 0)}%
                      </span>
                      {disk.status === "pending" && (
                        <span>
                          {disk.used} / {disk.size}
                        </span>
                      )}
                    </div>
                    <Progress
                      value={disk.quickScanProgress || 0}
                      className="h-2 progress-enhanced dark:bg-gray-700"
                      indicatorClassName={
                        disk.isPaused
                          ? "bg-orange-600 progress-indicator-enhanced dark:bg-orange-500"
                          : `bg-${FEATURE_COLORS.largeFiles}-500 progress-indicator-enhanced dark:bg-green-500`
                      }
                    />
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-0.5 dark:text-gray-300">
                      <span>Escaneo para Ordenar Discos: {Math.round(disk.slowScanProgress || 0)}%</span>
                      {disk.status !== "pending" && (
                        <span>
                          {disk.used} / {disk.size}
                        </span>
                      )}
                    </div>
                    <Progress
                      value={disk.slowScanProgress || 0}
                      className="h-2 progress-enhanced dark:bg-gray-700"
                      indicatorClassName={
                        disk.isPaused
                          ? "bg-orange-600 progress-indicator-enhanced dark:bg-orange-500"
                          : "bg-purple-500 progress-indicator-enhanced dark:bg-purple-400"
                      }
                    />
                  </div>

                  {(disk.status === "scanning" || disk.status === "paused") &&
                    disk.estimatedTimeRemaining !== undefined && (
                      <div
                        className={`text-xs ${
                          disk.isPaused
                            ? "text-orange-600 dark:text-orange-400"
                            : disk.scanType === "quick"
                              ? `text-${FEATURE_COLORS.largeFiles}-500 dark:text-green-400`
                              : "text-purple-500 dark:text-purple-300"
                        } mb-2 flex items-center`}
                      >
                        {disk.isPaused ? (
                          <Pause className="h-3 w-3 mr-1" />
                        ) : disk.scanType === "quick" ? (
                          <Zap className="h-3 w-3 mr-1" />
                        ) : (
                          <HardDrive className="h-3 w-3 mr-1" />
                        )}
                        <span>
                          {disk.isPaused
                            ? "Pausado - Reanudar para continuar"
                            : formatTimeRemaining(disk.estimatedTimeRemaining)}
                        </span>
                      </div>
                    )}

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div
                        className={cn(
                          "flex items-center",
                          disk.canAnalyzeDuplicates
                            ? `text-${FEATURE_COLORS.duplicates}-500 dark:text-blue-300`
                            : "text-gray-400 dark:text-gray-500",
                        )}
                      >
                        <Check className="h-3 w-3 mr-0.5" />
                        <span>Duplicados</span>
                      </div>
                      <div
                        className={cn(
                          "flex items-center",
                          disk.canOrganize
                            ? `text-${FEATURE_COLORS.organize}-500 dark:text-purple-300`
                            : "text-gray-400 dark:text-gray-500",
                        )}
                      >
                        <Check className="h-3 w-3 mr-0.5" />
                        <span>Organizar</span>
                      </div>
                    </div>
                    <div className="text-gray-500 dark:text-gray-300">{disk.free} libre</div>
                  </div>

                  {(disk.status === "pending" || disk.status === "error") && (
                    <div className="mt-3 flex space-x-1.5">
                      <button
                        onClick={() => startScan(disk.id, "quick")}
                        className={`flex-1 px-2 py-1 text-xs bg-${FEATURE_COLORS.largeFiles}-500 text-white rounded hover:bg-${FEATURE_COLORS.largeFiles}-600 transition-colors dark:bg-green-600 dark:hover:bg-green-700`}
                      >
                        Escanear
                      </button>
                    </div>
                  )}

                  {(disk.status === "scanning" || disk.status === "paused") && (
                    <div className="mt-3 flex space-x-1.5">
                      <button
                        onClick={() => togglePauseScan(disk.id)}
                        className="flex-1 px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors flex items-center justify-center dark:bg-orange-700 dark:hover:bg-orange-800"
                      >
                        {disk.isPaused ? (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Reanudar
                          </>
                        ) : (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pausar
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {disk.status === "complete" && (
                    <div className="mt-3 flex space-x-1.5">
                      <button
                        onClick={() => startScan(disk.id, "quick")}
                        className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        Volver a escanear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showExcludeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-4/5 max-w-6xl h-4/5 flex flex-col dark:bg-gray-800">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <FolderMinus className="h-5 w-5 mr-2 text-yellow-500 dark:text-yellow-400" />
                    <h3 className="text-lg font-medium dark:text-white">Excluir discos y carpetas del escaneo</h3>
                  </div>
                  <button
                    onClick={() => setShowExcludeModal(false)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                <div className="p-4 border-b border-gray-200 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 dark:border-gray-700">
                  <p className="text-sm text-yellow-700 dark:text-yellow-200">
                    Selecciona los discos y carpetas que deseas excluir del escaneo. Estos elementos no serán analizados
                    y no aparecerán en los resultados.
                  </p>
                </div>

                <div className="flex-1 overflow-hidden">
                  <FileExplorer
                    initialPath="C:/"
                    onSelectionChange={(items) => {
                      const paths = items.map((item) => item.path)
                      handleExcludeSelection(paths)
                    }}
                    viewModeOptions={true}
                    showDriveCheckboxes={true}
                  />
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => setShowExcludeModal(false)}
                    className="dark:text-gray-200 dark:border-gray-600"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={saveExclusions}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar exclusiones
                  </Button>
                </div>
              </div>
            </div>
          )}
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
