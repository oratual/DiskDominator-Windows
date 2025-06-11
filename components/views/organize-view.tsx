import React from "react";
"use client"

import type React from "react"
import type { FileItem } from "@/components/file-explorer"

import { useState, useRef, useEffect, useCallback } from "react"
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
import FileExplorer from "@/components/file-explorer"

// Datos de ejemplo para la vista de organización
const organizationSuggestions = [
  {
    id: 1,
    title: "Mover archivos de descargas",
    description: "Mover archivos PDF de descargas a documentos",
    fromPath: "C:/Users/Usuario/Downloads",
    toPath: "C:/Users/Usuario/Documents",
    fileCount: 24,
    totalSize: "45.2 MB",
    confidence: 85,
  },
  {
    id: 2,
    title: "Organizar fotos por fecha",
    description: "Agrupar fotos en carpetas por mes",
    fromPath: "C:/Users/Usuario/Pictures",
    toPath: "C:/Users/Usuario/Pictures/Organized",
    fileCount: 156,
    totalSize: "1.2 GB",
    confidence: 92,
  },
  {
    id: 3,
    title: "Archivos duplicados",
    description: "Eliminar copias duplicadas en documentos",
    fromPath: "C:/Users/Usuario/Documents",
    toPath: "Papelera",
    fileCount: 18,
    totalSize: "240 MB",
    confidence: 78,
    isDelete: true,
  },
  {
    id: 4,
    title: "Archivos temporales",
    description: "Eliminar archivos temporales antiguos",
    fromPath: "C:/Users/Usuario/AppData/Temp",
    toPath: "Papelera",
    fileCount: 342,
    totalSize: "560 MB",
    confidence: 95,
    isDelete: true,
  },
  {
    id: 5,
    title: "Organizar documentos de trabajo",
    description: "Mover documentos de trabajo a carpeta de proyectos",
    fromPath: "C:/Users/Usuario/Desktop",
    toPath: "C:/Users/Usuario/Documents/Projects",
    fileCount: 37,
    totalSize: "120 MB",
    confidence: 88,
  },
]

export default function OrganizeView() {
  const [selectedTab, setSelectedTab] = useState("explore")
  const [selectedLayout, setSelectedLayout] = useState("single") // "single", "horizontal", "vertical", "grid"
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null)

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
                  className="flex-1 bg-transparent outline-none text-sm border-none dark:text-gray-100 dark:placeholder-gray-400"
                />
                <button className="ml-2 text-blue-600 dark:text-blue-400">
                  <MessageSquare size={20} />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Sugerencia: Puedes especificar fechas, tamaños o tipos de archivo en tus instrucciones
              </div>
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
                <Button className="bg-[#7928CA] hover:bg-[#6B21A8] text-white text-sm h-8 dark:bg-purple-700 dark:hover:bg-purple-800 plan-confirmation-button">
                  <Check size={16} className="mr-1" />
                  Confirmar Plan
                </Button>
                <Button
                  variant="outline"
                  className="ml-3 text-sm h-8 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 plan-cancel-button"
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
                  <h2 className="text-lg font-medium mb-4 dark:text-gray-100">Cambios propuestos</h2>
                  <Card className="mb-6 p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-blue-800 mb-2 dark:text-blue-300">
                          Plan de reorganización de proyectos Unreal Engine
                        </h3>
                        <p className="text-sm dark:text-gray-300">
                          Basado en tu solicitud, he analizado tus proyectos de Unreal Engine y he preparado un plan
                          para reorganizarlos según su antigüedad. Moveré los{" "}
                          <strong className="dark:text-blue-200">4 proyectos con más de 3 años de antigüedad</strong>{" "}
                          (UE5_RPG de 2019, UE4_Shooter de 2020, UE4_RTS de
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="mb-6 p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-700">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <MessageSquare size={20} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-green-800 mb-2 dark:text-green-300">
                          Mover proyectos antiguos a la carpeta "antiguo unreal"
                        </h3>
                        <p className="text-sm dark:text-gray-300">
                          Moveré los proyectos UE5_RPG, UE4_Shooter, UE4_RTS y UE4_Strategy a la carpeta "E:/antiguo
                          unreal".
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="mb-6 p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <MessageSquare size={20} className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-purple-800 mb-2 dark:text-purple-300">
                          Mover proyectos recientes a la carpeta "J:/proyectos/unreal"
                        </h3>
                        <p className="text-sm dark:text-gray-300">
                          Moveré los proyectos UE5_FPS, UE5_MMO y UE5_Sandbox a la carpeta "J:/proyectos/unreal".
                        </p>
                      </div>
                    </div>
                  </Card>
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
                  <p className="text-sm dark:text-gray-300">
                    Este plan reorganizará tus proyectos de Unreal Engine según su antigüedad. Se moverán 4 proyectos
                    antiguos a la carpeta "E:/antiguo unreal" y 3 proyectos recientes a la carpeta
                    "J:/proyectos/unreal".
                  </p>
                  <ul className="list-disc pl-5 mt-4 dark:text-gray-300">
                    <li>
                      <span className="font-medium dark:text-gray-200">Proyectos antiguos (más de 3 años):</span>{" "}
                      UE5_RPG, UE4_Shooter, UE4_RTS, UE4_Strategy
                    </li>
                    <li>
                      <span className="font-medium dark:text-gray-200">Proyectos recientes (menos de 3 años):</span>{" "}
                      UE5_FPS, UE5_MMO, UE5_Sandbox
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
