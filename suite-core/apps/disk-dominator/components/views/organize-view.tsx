"use client"
import React from "react";

import type { FileItem } from "@/components/file-explorer"

import { useState, useRef, useEffect, useCallback } from "react"
import { useOrganization } from "@/hooks/useOrganization"
import { useOrganizationPlan } from "@/hooks/useOrganizationPlan"
import { useOrganizationPreview } from "@/hooks/useOrganizationPreview"
import {
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  Check,
  FolderPlus,
  ChevronRight,
  X,
  Copy,
  Info,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import FileExplorer from "@/components/file-explorer"

// Organization rules templates
const defaultRules = [
  {
    id: 'pdf-rule',
    name: 'Organize PDF files',
    enabled: true,
    priority: 1,
    condition: {
      condition_type: 'extension',
      operator: 'equals',
      value: 'pdf',
    },
    action: {
      action_type: 'move',
      destination: 'Documents/PDFs',
    },
    scope: {
      paths: ['Downloads'],
      recursive: true,
      include_hidden: false,
    },
  },
  {
    id: 'image-rule',
    name: 'Organize image files',
    enabled: true,
    priority: 2,
    condition: {
      condition_type: 'extension',
      operator: 'equals',
      value: 'jpg|jpeg|png|gif',
    },
    action: {
      action_type: 'move',
      destination: 'Pictures/Organized',
    },
    scope: {
      paths: ['Downloads', 'Desktop'],
      recursive: true,
      include_hidden: false,
    },
  },
]

export default function OrganizeView() {
  const [selectedTab, setSelectedTab] = useState("explore")
  const [selectedLayout, setSelectedLayout] = useState("single") // "single", "horizontal", "vertical", "grid"
  const [selectedPaths, setSelectedPaths] = useState<string[]>([])
  const [aiPrompt, setAiPrompt] = useState('')
  const [showRuleConfig, setShowRuleConfig] = useState(false)
  
  // Organization hooks
  const {
    analyzing,
    analysis,
    selectedSuggestions,
    error: orgError,
    getSuggestions,
    toggleSuggestion,
    selectAllSuggestions,
    clearSuggestions,
    getSelectedSuggestions,
  } = useOrganization()
  
  const {
    creating,
    executing,
    currentPlan,
    currentExecution,
    error: planError,
    createPlan,
    executePlan,
    rollbackPlan,
    clearPlan,
    formatDuration,
    formatFileSize,
  } = useOrganizationPlan()
  
  const {
    loading: previewLoading,
    preview,
    error: previewError,
    generatePreview,
    getChangeSummary,
    hasChanges,
    getImpactLevel,
    getImpactColor,
  } = useOrganizationPreview()

  // Estado para el panel de AI Assistant
  const [chatWidth, setChatWidth] = useState(300)
  const [isResizingChat, setIsResizingChat] = useState(false)

  // Estado para controlar si el panel de chat está completamente colapsado
  const [chatCollapsed, setChatCollapsed] = useState(false)

  // Estados para los paneles en vista horizontal
  const [horizontalSplit, setHorizontalSplit] = useState(0.5) // 50% por defecto
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false)

  // Estados para los paneles en vista vertical
  const [verticalSplit, setVerticalSplit] = useState(0.5) // 50% por defecto
  const [isResizingVertical, setIsResizingVertical] = useState(false)

  // Estados para los paneles en vista de cuadrícula - ahora independientes
  const [gridTopHorizontalSplit, setGridTopHorizontalSplit] = useState(0.5) // Divisor horizontal superior
  const [gridBottomHorizontalSplit, setGridBottomHorizontalSplit] = useState(0.5) // Divisor horizontal inferior
  const [gridLeftVerticalSplit, setGridLeftVerticalSplit] = useState(0.5) // Divisor vertical izquierdo
  const [isResizingGridTopHorizontal, setIsResizingGridTopHorizontal] = useState(false)
  const [isResizingGridBottomHorizontal, setIsResizingGridBottomHorizontal] = useState(false)
  const [isResizingGridLeftVertical, setIsResizingGridLeftVertical] = useState(false)

  // Multi-selection states
  const [selectedItems, setSelectedItems] = useState<FileItem[]>([])
  const [showBatchActions, setShowBatchActions] = useState(false)
  const [batchActionType, setBatchActionType] = useState<"move" | "copy" | "delete" | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null)

  // Referencias para los elementos DOM
  const chatRef = useRef<HTMLDivElement>(null)
  const chatResizeRef = useRef<HTMLDivElement>(null)
  const horizontalResizeRef = useRef<HTMLDivElement>(null)
  const verticalResizeRef = useRef<HTMLDivElement>(null)
  const gridTopHorizontalResizeRef = useRef<HTMLDivElement>(null)
  const gridBottomHorizontalResizeRef = useRef<HTMLDivElement>(null)
  const gridLeftVerticalResizeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Añadir estos estados para el carrusel de consejos después de los estados existentes
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [isRTL, setIsRTL] = useState(false) // Para idiomas que se leen de derecha a izquierda
  const [isPaused, setIsPaused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const tipIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Añadir el array de consejos
  const tips = [
    {
      icon: <Info className="h-4 w-4 text-yellow-400" />,
      text: "Selecciona múltiples archivos con Ctrl+clic o arrastrando el cursor para crear una selección.",
    },
    {
      icon: <Copy className="h-4 w-4 text-blue-400" />,
      text: "Usa Ctrl+C para copiar, Ctrl+X para cortar y Ctrl+V para pegar archivos rápidamente.",
    },
    {
      icon: <FolderPlus className="h-4 w-4 text-green-400" />,
      text: "Organiza tus archivos en carpetas por proyectos o categorías para encontrarlos fácilmente.",
    },
    {
      icon: <ArrowRight className="h-4 w-4 text-purple-400" />,
      text: "Arrastra archivos entre paneles. Mantén Ctrl para copiar en lugar de mover.",
    },
    {
      icon: <AlertTriangle className="h-4 w-4 text-orange-400" />,
      text: "Mueve archivos importantes a 'Archivados' antes de eliminarlos para evitar pérdidas.",
    },
  ]

  // Función para cambiar el layout y asegurar que estamos en la pestaña de exploración
  const changeLayout = (layout: string) => {
    setSelectedLayout(layout)
    setSelectedTab("explore")
  }

  // Handle selection changes from FileExplorer - memoizado para evitar recreaciones
  const handleSelectionChange = useCallback((items: FileItem[]) => {
    setSelectedItems(items)
    // Update selected paths for organization
    const paths = items.map(item => item.path)
    setSelectedPaths(paths)
  }, [])

  // Show notification
  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  // Handle batch operations
  const handleBatchOperation = (operation: "move" | "copy" | "delete" | "rename") => {
    if (selectedItems.length === 0) return

    switch (operation) {
      case "move":
        setBatchActionType("move")
        setShowBatchActions(true)
        break

      case "copy":
        setBatchActionType("copy")
        setShowBatchActions(true)
        break

      case "delete":
        if (confirm(`¿Estás seguro de que quieres eliminar ${selectedItems.length} elementos?`)) {
          showNotification(`${selectedItems.length} elementos eliminados`, "success")
          setSelectedItems([])
        }
        break

      case "rename":
        if (selectedItems.length === 1) {
          const newName = prompt("Introduce el nuevo nombre:", selectedItems[0].name)
          if (newName) {
            showNotification(`Elemento renombrado a "${newName}"`, "success")
          }
        } else {
          alert("La función de renombrado por lotes no está disponible aún")
        }
        break
    }
  }

  // Execute batch operation
  const executeBatchOperation = (destinationPath: string) => {
    if (!batchActionType || selectedItems.length === 0) return

    const operation = batchActionType
    const itemsText = selectedItems.length === 1 ? `"${selectedItems[0].name}"` : `${selectedItems.length} elementos`

    showNotification(`${operation === "copy" ? "Copiados" : "Movidos"} ${itemsText} a ${destinationPath}`, "success")

    setShowBatchActions(false)
    setBatchActionType(null)

    // In a real app, we would actually perform the operation here
  }

  // Organization workflow functions
  const handleAnalyzeSelected = useCallback(async () => {
    if (selectedPaths.length === 0) {
      showNotification("Selecciona archivos o carpetas para analizar", "error")
      return
    }

    try {
      await getSuggestions(selectedPaths)
      setSelectedTab("visual")
    } catch (error) {
      showNotification("Error al analizar los archivos seleccionados", "error")
    }
  }, [selectedPaths, getSuggestions])

  const handleCreatePlan = useCallback(async () => {
    const selected = getSelectedSuggestions()
    if (selected.length === 0) {
      showNotification("Selecciona al menos una sugerencia", "error")
      return
    }

    try {
      const plan = await createPlan(
        "Plan de Organización",
        `Plan generado automáticamente con ${selected.length} operaciones`,
        defaultRules,
        aiPrompt.length > 0,
        aiPrompt || undefined,
        selectedPaths
      )
      
      if (plan) {
        await generatePreview(plan.id)
        showNotification("Plan creado exitosamente", "success")
      }
    } catch (error) {
      showNotification("Error al crear el plan de organización", "error")
    }
  }, [getSelectedSuggestions, createPlan, aiPrompt, selectedPaths, generatePreview])

  const handleExecutePlan = useCallback(async (dryRun = false) => {
    if (!currentPlan) {
      showNotification("No hay plan para ejecutar", "error")
      return
    }

    try {
      const execution = await executePlan(currentPlan.id, {
        dryRun,
        createBackup: true,
      })
      
      if (execution) {
        showNotification(
          dryRun ? "Simulación completada" : "Ejecución iniciada",
          "success"
        )
      }
    } catch (error) {
      showNotification("Error al ejecutar el plan", "error")
    }
  }, [currentPlan, executePlan])

  const handleRollback = useCallback(async () => {
    if (!currentPlan) return

    try {
      const success = await rollbackPlan(currentPlan.id)
      if (success) {
        showNotification("Cambios revertidos exitosamente", "success")
      }
    } catch (error) {
      showNotification("Error al revertir los cambios", "error")
    }
  }, [currentPlan, rollbackPlan])

  const handleSendAIPrompt = useCallback(async () => {
    if (!aiPrompt.trim()) return

    try {
      await handleAnalyzeSelected()
      // Here we would integrate with AI suggestions based on the prompt
      showNotification("Analizando con IA...", "success")
    } catch (error) {
      showNotification("Error al procesar la consulta de IA", "error")
    }
  }, [aiPrompt, handleAnalyzeSelected])

  // Manejo del redimensionamiento del chat
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

  // Manejo del redimensionamiento horizontal
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingHorizontal || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const contentWidth = containerRect.width - chatWidth
      const relativeX = e.clientX - containerRect.left - chatWidth
      const newSplit = Math.max(0.1, Math.min(0.9, relativeX / contentWidth))

      setHorizontalSplit(newSplit)
    }

    const handleMouseUp = () => {
      setIsResizingHorizontal(false)
      document.body.style.cursor = "default"
      document.body.style.userSelect = "auto"
    }

    if (isResizingHorizontal) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizingHorizontal, chatWidth])

  // Manejo del redimensionamiento vertical
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingVertical || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const contentHeight = containerRect.height
      const relativeY = e.clientY - containerRect.top
      const newSplit = Math.max(0.1, Math.min(0.9, relativeY / contentHeight))

      setVerticalSplit(newSplit)
    }

    const handleMouseUp = () => {
      setIsResizingVertical(false)
      document.body.style.cursor = "default"
      document.body.style.userSelect = "auto"
    }

    if (isResizingVertical) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizingVertical])

  // Manejo del redimensionamiento horizontal superior en la cuadrícula
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingGridTopHorizontal || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const contentWidth = containerRect.width - (chatCollapsed ? 40 : chatWidth)
      const relativeX = e.clientX - containerRect.left - (chatCollapsed ? 40 : chatWidth)
      const newSplit = Math.max(0.1, Math.min(0.9, relativeX / contentWidth))

      // Solo actualizar si el valor realmente cambió
      if (Math.abs(newSplit - gridTopHorizontalSplit) > 0.001) {
        setGridTopHorizontalSplit(newSplit)
      }
    }

    const handleMouseUp = () => {
      setIsResizingGridTopHorizontal(false)
      document.body.style.cursor = "default"
      document.body.style.userSelect = "auto"
    }

    if (isResizingGridTopHorizontal) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizingGridTopHorizontal, chatWidth, chatCollapsed, gridTopHorizontalSplit])

  // Manejo del redimensionamiento horizontal inferior en la cuadrícula
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingGridBottomHorizontal || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const contentWidth = containerRect.width - (chatCollapsed ? 40 : chatWidth)
      const relativeX = e.clientX - containerRect.left - (chatCollapsed ? 40 : chatWidth)
      const newSplit = Math.max(0.1, Math.min(0.9, relativeX / contentWidth))

      setGridBottomHorizontalSplit(newSplit)
    }

    const handleMouseUp = () => {
      setIsResizingGridBottomHorizontal(false)
      document.body.style.cursor = "default"
      document.body.style.userSelect = "auto"
    }

    if (isResizingGridBottomHorizontal) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizingGridBottomHorizontal, chatWidth, chatCollapsed])

  // Manejo del redimensionamiento vertical en la cuadrícula
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingGridLeftVertical || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const contentHeight = containerRect.height
      const relativeY = e.clientY - containerRect.top
      const newSplit = Math.max(0.1, Math.min(0.9, relativeY / contentHeight))

      setGridLeftVerticalSplit(newSplit)
    }

    const handleMouseUp = () => {
      setIsResizingGridLeftVertical(false)
      document.body.style.cursor = "default"
      document.body.style.userSelect = "auto"
    }

    if (isResizingGridLeftVertical) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizingGridLeftVertical])

  // Función para avanzar al siguiente consejo con transición suave
  const nextTip = useCallback(() => {
    if (isTransitioning) return

    setIsTransitioning(true)

    setCurrentTipIndex((prevIndex) => {
      // Skip directly to the first tip if at the last tip
      if (prevIndex === tips.length - 1) {
        return 0
      }
      // Otherwise, go to the next tip
      return prevIndex + 1
    })

    // Establecer un tiempo para quitar el estado de transición
    setTimeout(() => {
      setIsTransitioning(false)
    }, 300) // Duración de la transición
  }, [tips.length, isTransitioning])

  // Función para retroceder al consejo anterior con transición suave
  const prevTip = useCallback(() => {
    if (isTransitioning) return

    setIsTransitioning(true)

    setCurrentTipIndex((prevIndex) => {
      // Skip directly to the last tip if at the first tip
      if (prevIndex === 0) {
        return tips.length - 1
      }
      // Otherwise, go to the previous tip
      return prevIndex - 1
    })

    // Establecer un tiempo para quitar el estado de transición
    setTimeout(() => {
      setIsTransitioning(false)
    }, 300) // Duración de la transición
  }, [tips.length, isTransitioning])

  // Rotación automática de consejos
  useEffect(() => {
    // Limpiar cualquier intervalo existente
    if (tipIntervalRef.current) {
      clearInterval(tipIntervalRef.current)
    }

    // Crear un nuevo intervalo solo si no está pausado
    if (!isPaused) {
      tipIntervalRef.current = setInterval(() => {
        if (isRTL) {
          prevTip()
        } else {
          nextTip()
        }
      }, 8000) // Cambiar cada 8 segundos
    }

    // Cleanup function
    return () => {
      if (tipIntervalRef.current) {
        clearInterval(tipIntervalRef.current)
      }
    }
  }, [nextTip, prevTip, isPaused, isRTL])

  // Iniciar la rotación automática cuando el componente se monte
  useEffect(() => {
    setIsPaused(false)
    return () => {
      if (tipIntervalRef.current) {
        clearInterval(tipIntervalRef.current)
      }
    }
  }, [])

  const startResizingChat = () => {
    if (chatCollapsed) return
    setIsResizingChat(true)
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
  }

  const startResizingHorizontal = () => {
    setIsResizingHorizontal(true)
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
  }

  const startResizingVertical = () => {
    setIsResizingVertical(true)
    document.body.style.cursor = "ns-resize"
    document.body.style.userSelect = "none"
  }

  const startResizingGridTopHorizontal = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingGridTopHorizontal(true)
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
  }

  const startResizingGridBottomHorizontal = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingGridBottomHorizontal(true)
    document.body.style.cursor = "ew-resize"
    document.body.style.userSelect = "none"
  }

  const startResizingGridLeftVertical = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingGridLeftVertical(true)
    document.body.style.cursor = "ns-resize"
    document.body.style.userSelect = "none"
  }

  return (
    <div ref={containerRef} className="flex h-full overflow-hidden dark:bg-gray-900 dark:text-white">
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
                onClick={() => setChatCollapsed(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft size={20} className="text-gray-500 hover:text-gray-700" />
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
            <div className="transform -rotate-90 whitespace-nowrap text-lg font-medium text-gray-500">AI</div>
          </div>
        ) : (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 max-w-xs chat-message-user">
                  <p className="text-sm dark:text-white">
                    Coge las carpetas con proyectos de Unreal Engine de más de 3 años y ponlas en "antiguo unreal" en E:
                    y los proyectos de menos de tres años ponlos en J:/proyectos/unreal
                  </p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-xs chat-message-ai">
                  <p className="text-sm dark:text-gray-100">
                    He analizado tus discos y encontré 12 proyectos de Unreal Engine. 7 son de hace más de 3 años y 5
                    son más recientes. ¿Quieres ver mi plan para reorganizarlos?
                  </p>
                </div>
              </div>

              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 max-w-xs chat-message-user">
                  <p className="text-sm dark:text-white">Sí, muéstrame el plan</p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-xs chat-message-ai">
                  <p className="text-sm dark:text-gray-100">
                    He preparado un plan para mover tus proyectos de Unreal Engine. Por favor, revisa los cambios
                    propuestos en el panel de visualización y confirma si estás de acuerdo.
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-2 chat-input">
                <Input
                  type="text"
                  placeholder="Escribe tu instrucción aquí..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendAIPrompt()}
                  className="flex-1 bg-transparent outline-none text-sm border-none dark:text-gray-100 dark:placeholder-gray-400"
                  disabled={analyzing}
                />
                <button 
                  className="ml-2 text-blue-600 dark:text-blue-400 disabled:opacity-50"
                  onClick={handleSendAIPrompt}
                  disabled={analyzing || !aiPrompt.trim()}
                >
                  <MessageSquare size={20} />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {analyzing ? "Analizando..." : "Sugerencia: Puedes especificar fechas, tamaños o tipos de archivo en tus instrucciones"}
              </div>
              
              {/* Quick action buttons */}
              {selectedPaths.length > 0 && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAnalyzeSelected}
                    disabled={analyzing}
                    className="text-xs"
                  >
                    {analyzing ? "Analizando..." : "Analizar selección"}
                  </Button>
                  {analysis && analysis.suggestions.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTab("visual")}
                      className="text-xs"
                    >
                      Ver sugerencias
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Divisor redimensionable para el chat */}
      <div
        ref={chatResizeRef}
        className={`relative w-px bg-yellow-600/30 ${chatCollapsed ? "cursor-default" : "cursor-ew-resize"} flex-shrink-0 transition-colors`}
        onMouseDown={startResizingChat}
      >
        <div className="absolute inset-0 w-px bg-yellow-600/30 hover:bg-yellow-600"></div>
        {/* Área ampliada para mouseOver, invisible pero interactiva */}
        <div className="absolute inset-y-0 -left-2 -right-2"></div>
      </div>

      {/* Right Panel - Visualization and Controls */}
      <div className="flex-1 flex flex-col h-full overflow-hidden dark:bg-gray-900">
        {/* Tabs */}
        <Tabs
          defaultValue="explore"
          className="flex flex-col h-full"
          onValueChange={setSelectedTab}
          value={selectedTab}
        >
          <div className="border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
            <TabsList className="h-auto p-0 flex items-center">
              <TabsTrigger
                value="explore"
                className="px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-yellow-600 data-[state=active]:shadow-none rounded-none dark:text-gray-200 dark:data-[state=active]:text-white"
              >
                Exploración
              </TabsTrigger>

              {/* Controles de layout - ahora fuera del TabsList */}
              <div className="flex items-center ml-2 space-x-1">
                <button
                  className={`p-1.5 rounded ${selectedLayout === "single" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" : "text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"} relative group`}
                  onClick={() => changeLayout("single")}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  <span className="absolute top-1/2 right-full -translate-y-1/2 mr-2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    Vista única
                  </span>
                </button>
                <button
                  className={`p-1.5 rounded ${selectedLayout === "horizontal" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" : "text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"} relative group`}
                  onClick={() => changeLayout("horizontal")}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="8" height="18" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
                    <rect x="13" y="3" width="8" height="18" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  <span className="absolute top-1/2 right-full -translate-y-1/2 mr-2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    Vista horizontal
                  </span>
                </button>
                <button
                  className={`p-1.5 rounded ${selectedLayout === "vertical" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" : "text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"} relative group`}
                  onClick={() => changeLayout("vertical")}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
                    <rect x="3" y="13" width="18" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  <span className="absolute top-1/2 right-full -translate-y-1/2 mr-2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    Vista vertical
                  </span>
                </button>
                <button
                  className={`p-1.5 rounded ${selectedLayout === "grid" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" : "text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"} relative group`}
                  onClick={() => changeLayout("grid")}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
                    <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
                    <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
                    <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                  <span className="absolute top-1/2 right-full -translate-y-1/2 mr-2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                    Vista en cuadrícula
                  </span>
                </button>
              </div>

              {/* Separador vertical */}
              <div className="h-6 mx-3 border-l border-gray-300 dark:border-gray-600"></div>

              {/* Grupo de pestañas relacionadas - ahora dentro del TabsList */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-t-md flex items-center plan-confirmation-tab">
                <TabsTrigger
                  value="visual"
                  className="px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none dark:text-gray-200 dark:data-[state=active]:text-white"
                >
                  Visualización
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="px-4 py-3 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none dark:text-gray-200 dark:data-[state=active]:text-white"
                >
                  Resumen
                </TabsTrigger>
                <Button 
                  className="bg-[#7928CA] hover:bg-[#6B21A8] text-white text-sm h-8 dark:bg-purple-700 dark:hover:bg-purple-800 plan-confirmation-button"
                  onClick={() => handleExecutePlan(false)}
                  disabled={!currentPlan || executing || currentPlan.status !== 'ready'}
                >
                  <Check size={16} className="mr-1" />
                  {executing ? "Ejecutando..." : "Confirmar Plan"}
                </Button>
                <Button
                  variant="outline"
                  className="ml-3 text-sm h-8 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 plan-cancel-button"
                  onClick={clearPlan}
                  disabled={executing}
                >
                  <X size={16} className="mr-1" />
                  Cancelar Plan
                </Button>
              </div>
            </TabsList>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <TabsContent
              value="explore"
              className="m-0 p-0 flex-1 h-full overflow-hidden"
              style={{ display: selectedTab === "explore" ? "flex" : "none" }}
            >
              <div className="flex flex-col h-full w-full">
                {/* Carousel Tips - Refactored for single-line display */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 m-4 mb-2 flex flex-col relative overflow-hidden h-6 dark:bg-yellow-900/20 dark:border-yellow-700 carousel-tip">
                  {/* Left navigation button */}
                  <button
                    className="absolute left-1 top-0 bottom-0 z-10 p-0.5 flex items-center justify-center rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 text-yellow-600 hover:text-yellow-800 dark:bg-gray-800 dark:text-yellow-500"
                    onClick={(e) => {
                      e.preventDefault()
                      prevTip()
                      setIsPaused(true)
                      // Reanudar la rotación automática después de 10 segundos de inactividad
                      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current)
                      tipIntervalRef.current = setTimeout(() => setIsPaused(false), 10000)
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300" />
                  </button>

                  {/* Carousel container */}
                  <div ref={carouselRef} className="flex-1 overflow-hidden px-8 py-0">
                    {/* Only render the current tip */}
                    <div
                      className={`flex items-center w-full h-6 transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
                    >
                      <div className="flex-shrink-0 carousel-tip-icon">{tips[currentTipIndex].icon}</div>
                      <div className="ml-2 flex-1 overflow-hidden">
                        <p className="text-xs text-yellow-700 whitespace-nowrap overflow-hidden text-ellipsis dark:text-yellow-300 carousel-tip-text">
                          <span className="font-medium">
                            Consejo {currentTipIndex + 1}/{tips.length}:
                          </span>{" "}
                          {tips[currentTipIndex].text}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right navigation button */}
                  <button
                    className="absolute right-1 top-0 bottom-0 z-10 p-0.5 flex items-center justify-center rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 text-yellow-600 hover:text-yellow-800 dark:bg-gray-800 dark:text-yellow-500"
                    onClick={(e) => {
                      e.preventDefault()
                      nextTip()
                      setIsPaused(true)
                      // Reanudar la rotación automática después de 10 segundos de inactividad
                      if (tipIntervalRef.current) clearInterval(tipIntervalRef.current)
                      tipIntervalRef.current = setTimeout(() => setIsPaused(false), 10000)
                    }}
                  >
                    <ChevronRight className="h-4 w-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300" />
                  </button>
                </div>

                {selectedLayout === "single" && (
                  <FileExplorer initialPath="C:/" onSelectionChange={handleSelectionChange} viewModeOptions={true} />
                )}

                {selectedLayout === "horizontal" && (
                  <div className="flex flex-1 overflow-hidden">
                    {/* Panel izquierdo */}
                    <div
                      className="flex flex-col border-r border-yellow-600/30"
                      style={{ width: `${horizontalSplit * 100}%` }}
                    >
                      <FileExplorer
                        initialPath="C:/"
                        onSelectionChange={handleSelectionChange}
                        viewModeOptions={true}
                      />
                    </div>

                    {/* Divisor redimensionable horizontal */}
                    <div
                      ref={horizontalResizeRef}
                      className="relative w-px bg-yellow-600/30 cursor-ew-resize flex-shrink-0 transition-colors"
                      onMouseDown={startResizingHorizontal}
                    >
                      <div className="absolute inset-0 w-px bg-yellow-600/30 hover:bg-yellow-600"></div>
                      {/* Área ampliada para mouseOver, invisible pero interactiva */}
                      <div className="absolute inset-y-0 -left-2 -right-2"></div>
                    </div>

                    {/* Panel derecho */}
                    <div className="flex flex-col" style={{ width: `${(1 - horizontalSplit) * 100}%` }}>
                      <FileExplorer
                        initialPath="D:/"
                        onSelectionChange={handleSelectionChange}
                        viewModeOptions={true}
                      />
                    </div>
                  </div>
                )}

                {selectedLayout === "vertical" && (
                  <div className="flex flex-col h-full">
                    {/* Panel superior */}
                    <div
                      className="flex flex-col border-b border-yellow-600/30"
                      style={{ height: `${verticalSplit * 100}%` }}
                    >
                      <FileExplorer
                        initialPath="C:/"
                        onSelectionChange={handleSelectionChange}
                        viewModeOptions={true}
                      />
                    </div>

                    {/* Divisor redimensionable vertical */}
                    <div
                      ref={verticalResizeRef}
                      className="relative h-px bg-yellow-600/30 cursor-ns-resize flex-shrink-0 transition-colors"
                      onMouseDown={startResizingVertical}
                    >
                      <div className="absolute inset-0 h-px bg-yellow-600/30 hover:bg-yellow-600"></div>
                      {/* Área ampliada para mouseOver, invisible pero interactiva */}
                      <div className="absolute inset-x-0 -top-2 -bottom-2"></div>
                    </div>

                    {/* Panel inferior */}
                    <div className="flex flex-col" style={{ height: `${(1 - verticalSplit) * 100}%` }}>
                      <FileExplorer
                        initialPath="D:/"
                        onSelectionChange={handleSelectionChange}
                        viewModeOptions={true}
                      />
                    </div>
                  </div>
                )}

                {selectedLayout === "grid" && (
                  <div className="flex flex-col h-full relative">
                    {/* Main vertical divider */}
                    <div
                      className="absolute left-0 right-0 h-px bg-yellow-600/30 cursor-ns-resize z-10 hover:bg-yellow-600"
                      style={{ top: `${gridLeftVerticalSplit * 100}%` }}
                      onMouseDown={startResizingGridLeftVertical}
                    >
                      <div className="absolute inset-x-0 -top-2 -bottom-2"></div>
                    </div>

                    {/* Top row */}
                    <div className="flex relative" style={{ height: `${gridLeftVerticalSplit * 100}%` }}>
                      {/* Top horizontal divider */}
                      <div
                        ref={gridTopHorizontalResizeRef}
                        className="absolute top-0 bottom-0 w-px bg-yellow-600/30 cursor-ew-resize z-10 hover:bg-yellow-600"
                        style={{ left: `${gridTopHorizontalSplit * 100}%` }}
                        onMouseDown={startResizingGridTopHorizontal}
                      >
                        <div className="absolute inset-y-0 -left-2 -right-2"></div>
                      </div>

                      {/* Top left panel */}
                      <div
                        className="overflow-hidden border-r border-b border-yellow-600/30"
                        style={{ width: `${gridTopHorizontalSplit * 100}%` }}
                      >
                        <FileExplorer
                          initialPath="C:/"
                          compact={true}
                          onSelectionChange={handleSelectionChange}
                          viewModeOptions={true}
                        />
                      </div>

                      {/* Top right panel */}
                      <div
                        className="overflow-hidden border-b border-yellow-600/30"
                        style={{ width: `${(1 - gridTopHorizontalSplit) * 100}%` }}
                      >
                        <FileExplorer
                          initialPath="D:/"
                          compact={true}
                          onSelectionChange={handleSelectionChange}
                          viewModeOptions={true}
                        />
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex relative" style={{ height: `${(1 - gridLeftVerticalSplit) * 100}%` }}>
                      {/* Bottom horizontal divider */}
                      <div
                        ref={gridBottomHorizontalResizeRef}
                        className="absolute top-0 bottom-0 w-px bg-yellow-600/30 cursor-ew-resize z-10 hover:bg-yellow-600"
                        style={{ left: `${gridBottomHorizontalSplit * 100}%` }}
                        onMouseDown={startResizingGridBottomHorizontal}
                      >
                        <div className="absolute inset-y-0 -left-2 -right-2"></div>
                      </div>

                      {/* Bottom left panel */}
                      <div
                        className="overflow-hidden border-r border-yellow-600/30"
                        style={{ width: `${gridBottomHorizontalSplit * 100}%` }}
                      >
                        <FileExplorer
                          initialPath="E:/"
                          compact={true}
                          onSelectionChange={handleSelectionChange}
                          viewModeOptions={true}
                        />
                      </div>

                      {/* Bottom right panel */}
                      <div className="overflow-hidden" style={{ width: `${(1 - gridBottomHorizontalSplit) * 100}%` }}>
                        <FileExplorer
                          initialPath="J:/"
                          compact={true}
                          onSelectionChange={handleSelectionChange}
                          viewModeOptions={true}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="visual"
              className="m-0 p-0 flex-1 h-full overflow-hidden"
              style={{ display: selectedTab === "visual" ? "block" : "none" }}
            >
              <div className="h-full overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium dark:text-gray-100">Sugerencias de organización</h2>
                    {analysis && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={selectAllSuggestions}
                          disabled={creating}
                        >
                          Seleccionar todas
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={clearSuggestions}
                          disabled={creating}
                        >
                          Limpiar selección
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Error states */}
                  {orgError && (
                    <Card className="mb-4 p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-700">
                      <p className="text-sm text-red-700 dark:text-red-300">{orgError}</p>
                    </Card>
                  )}

                  {/* Loading state */}
                  {analyzing && (
                    <Card className="mb-4 p-4">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                        <p className="text-sm">Analizando archivos y generando sugerencias...</p>
                      </div>
                    </Card>
                  )}

                  {/* Organization suggestions */}
                  {analysis && analysis.suggestions.length > 0 ? (
                    <div className="space-y-4">
                      {analysis.suggestions.map((suggestion) => (
                        <Card
                          key={suggestion.id}
                          className={`p-4 border-l-4 cursor-pointer transition-all ${
                            selectedSuggestions.includes(suggestion.id)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                          }`}
                          onClick={() => toggleSuggestion(suggestion.id)}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mr-3">
                              <input
                                type="checkbox"
                                checked={selectedSuggestions.includes(suggestion.id)}
                                onChange={() => toggleSuggestion(suggestion.id)}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                  {suggestion.title}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(suggestion.confidence * 100)}% confianza
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {suggestion.description}
                              </p>
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <span className="mr-4">
                                  Tiempo estimado: {formatDuration(suggestion.estimated_time)}
                                </span>
                                <span>
                                  Archivos afectados: {suggestion.affected_files.length}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                                {suggestion.reason}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}

                      {/* Create plan button */}
                      {selectedSuggestions.length > 0 && (
                        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-green-800 dark:text-green-300 mb-1">
                                Crear plan de organización
                              </h3>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                {selectedSuggestions.length} operaciones seleccionadas
                              </p>
                            </div>
                            <Button
                              onClick={handleCreatePlan}
                              disabled={creating}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {creating ? "Creando..." : "Crear Plan"}
                            </Button>
                          </div>
                        </Card>
                      )}
                    </div>
                  ) : analysis && !analyzing ? (
                    <Card className="p-8 text-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No se encontraron sugerencias
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Los archivos seleccionados ya están bien organizados o no se detectaron patrones de mejora.
                      </p>
                      <Button variant="outline" onClick={() => setSelectedTab("explore")}>
                        Seleccionar otros archivos
                      </Button>
                    </Card>
                  ) : !analyzing && (
                    <Card className="p-8 text-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Selecciona archivos para organizar
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Usa el explorador de archivos para seleccionar carpetas o archivos que quieras organizar.
                      </p>
                      <Button variant="outline" onClick={() => setSelectedTab("explore")}>
                        Ir al explorador
                      </Button>
                    </Card>
                  )}

                  {/* Organization insights */}
                  {analysis && analysis.insights && (
                    <Card className="mt-6 p-4">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Análisis de la estructura
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {analysis.insights.disorganized_folders.length > 0 && (
                          <div>
                            <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                              Carpetas desorganizadas
                            </h4>
                            <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                              {analysis.insights.disorganized_folders.map((folder, index) => (
                                <li key={index} className="truncate">{folder}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {analysis.insights.unused_directories.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Directorios no utilizados
                            </h4>
                            <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                              {analysis.insights.unused_directories.map((dir, index) => (
                                <li key={index} className="truncate">{dir}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="summary"
              className="m-0 p-0 flex-1 h-full overflow-hidden"
              style={{ display: selectedTab === "summary" ? "block" : "none" }}
            >
              <div className="h-full overflow-auto">
                <div className="p-6">
                  <h2 className="text-lg font-medium mb-4 dark:text-gray-100">Resumen del plan</h2>
                  
                  {currentPlan ? (
                    <div className="space-y-6">
                      {/* Plan overview */}
                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {currentPlan.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {currentPlan.description}
                            </p>
                          </div>
                          <Badge className={`
                            ${currentPlan.status === 'ready' ? 'bg-green-100 text-green-700' : ''}
                            ${currentPlan.status === 'executing' ? 'bg-blue-100 text-blue-700' : ''}
                            ${currentPlan.status === 'completed' ? 'bg-gray-100 text-gray-700' : ''}
                            ${currentPlan.status === 'failed' ? 'bg-red-100 text-red-700' : ''}
                          `}>
                            {currentPlan.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">Operaciones:</span>
                            <p className="text-gray-600 dark:text-gray-400">{currentPlan.operations.length}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">Archivos:</span>
                            <p className="text-gray-600 dark:text-gray-400">{currentPlan.metadata.total_files}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">Tamaño:</span>
                            <p className="text-gray-600 dark:text-gray-400">{formatFileSize(currentPlan.metadata.total_size)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">Tiempo estimado:</span>
                            <p className="text-gray-600 dark:text-gray-400">{formatDuration(currentPlan.metadata.estimated_duration)}</p>
                          </div>
                        </div>
                      </Card>

                      {/* Preview section */}
                      {preview && (
                        <Card className="p-4">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                            Vista previa de cambios
                          </h3>
                          
                          {previewLoading && (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                              <p className="text-sm">Generando vista previa...</p>
                            </div>
                          )}
                          
                          {hasChanges() && (
                            <div className={`p-3 rounded-lg border ${getImpactColor()}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Impacto: {getImpactLevel()}</span>
                                <span className="text-sm">{getChangeSummary()?.total} cambios</span>
                              </div>
                              
                              {getChangeSummary() && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                  {getChangeSummary()!.creates > 0 && (
                                    <span>Crear: {getChangeSummary()!.creates}</span>
                                  )}
                                  {getChangeSummary()!.moves > 0 && (
                                    <span>Mover: {getChangeSummary()!.moves}</span>
                                  )}
                                  {getChangeSummary()!.renames > 0 && (
                                    <span>Renombrar: {getChangeSummary()!.renames}</span>
                                  )}
                                  {getChangeSummary()!.deletes > 0 && (
                                    <span>Eliminar: {getChangeSummary()!.deletes}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      )}

                      {/* Execution controls */}
                      <Card className="p-4">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                          Controles de ejecución
                        </h3>
                        
                        {currentExecution && currentExecution.status === 'running' ? (
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progreso</span>
                                <span>{Math.round(currentExecution.progress.percentage)}%</span>
                              </div>
                              <Progress value={currentExecution.progress.percentage} className="w-full" />
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Operación {currentExecution.progress.current_operation} de {currentExecution.progress.total_operations}
                              {currentExecution.progress.current_file && (
                                <span className="block">Procesando: {currentExecution.progress.current_file}</span>
                              )}
                            </p>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleExecutePlan(true)}
                              disabled={executing || currentPlan.status !== 'ready'}
                              variant="outline"
                            >
                              Simular ejecución
                            </Button>
                            
                            <Button
                              onClick={() => handleExecutePlan(false)}
                              disabled={executing || currentPlan.status !== 'ready'}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {executing ? "Ejecutando..." : "Ejecutar plan"}
                            </Button>
                            
                            {currentExecution?.rollback_available && (
                              <Button
                                onClick={handleRollback}
                                disabled={executing}
                                variant="destructive"
                              >
                                Revertir cambios
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {planError && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{planError}</p>
                        )}
                      </Card>

                      {/* Execution summary */}
                      {currentExecution?.summary && (
                        <Card className="p-4">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                            Resumen de ejecución
                          </h3>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">Archivos movidos:</span>
                              <p className="text-gray-600 dark:text-gray-400">{currentExecution.summary.files_moved}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">Renombrados:</span>
                              <p className="text-gray-600 dark:text-gray-400">{currentExecution.summary.files_renamed}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">Eliminados:</span>
                              <p className="text-gray-600 dark:text-gray-400">{currentExecution.summary.files_deleted}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">Espacio liberado:</span>
                              <p className="text-gray-600 dark:text-gray-400">{formatFileSize(currentExecution.summary.space_saved)}</p>
                            </div>
                          </div>
                          
                          {currentExecution.summary.errors.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Errores:</h4>
                              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                                {currentExecution.summary.errors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card className="p-8 text-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No hay plan de organización
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Crea un plan de organización seleccionando archivos y generando sugerencias.
                      </p>
                      <Button variant="outline" onClick={() => setSelectedTab("explore")}>
                        Empezar organización
                      </Button>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
