"use client"
import React from "react";

import { useState, useEffect, useRef } from "react"
import { EnhancedDuplicates } from "./duplicates-view/enhanced-duplicates"
import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { MessageSquare, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import type React from "react"
import {
  Copy,
  Trash2,
  Star,
  Folder,
  ImageIcon,
  FileVideo,
  File,
  ChevronDown,
  List,
  Grid,
  Eye,
  FolderOpen,
  Info,
  Zap,
} from "lucide-react"
import { Card } from "@/components/ui/card"

// Import the DiskSelector component at the top of the file
import DiskSelector, { type Disk } from "@/components/disk-selector"

interface DuplicatesViewProps {
  params?: {
    scanId?: string
  }
}

const DuplicatesView = ({ params }: DuplicatesViewProps = { params: undefined }) => {
  const scanId = params?.scanId || "default"
  const router = useRouter()
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [selectedView, setSelectedView] = useState("simple")
  const [selectedType, setSelectedType] = useState("all")
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null)
  const [keepOption, setKeepOption] = useState("newest")
  const [viewMode, setViewMode] = useState("list") // "list" or "explorer"
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDisks, setSelectedDisks] = useState<string[]>(["C", "D", "E", "J"])
  const [isClient, setIsClient] = useState(false)
  const [data, setData] = useState<any[]>([]) // Initialize with a default value
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)

  // AI Assistant states (from Big Files View)
  const [chatWidth, setChatWidth] = useState(300)
  const [isResizingChat, setIsResizingChat] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const chatResizeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [showAIAssistant, setShowAIAssistant] = useState(true)
  const [aiMessages, setAiMessages] = useState([
    {
      role: "assistant",
      content: "He encontrado varios archivos duplicados en tu sistema.",
    },
    { role: "assistant", content: "¿Quieres que te ayude a decidir cuáles conservar y cuáles eliminar?" },
  ])
  const [userInput, setUserInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

      if (userInput.toLowerCase().includes("eliminar") || userInput.toLowerCase().includes("borrar")) {
        response =
          "Puedo ayudarte a eliminar los duplicados de forma segura. Te recomendaría mantener los archivos originales y eliminar las copias más recientes o las que estén en ubicaciones temporales."
      } else if (userInput.toLowerCase().includes("conservar") || userInput.toLowerCase().includes("mantener")) {
        response =
          "Generalmente es mejor conservar los archivos con la fecha de creación más antigua o los que estén en ubicaciones más organizadas de tu sistema."
      } else if (userInput.toLowerCase().includes("analizar") || userInput.toLowerCase().includes("revisar")) {
        response =
          "Analizando los duplicados... Veo que muchos de estos archivos son documentos y fotos. Podríamos organizarlos por tipo y fecha para que decidas cuáles mantener."
      } else {
        response =
          "Puedo ayudarte a gestionar estos archivos duplicados. ¿Quieres que te sugiera un plan para eliminarlos de forma segura?"
      }

      setAiMessages((prev) => [...prev, { role: "assistant", content: response }])
    }, 1000)
  }

  // AI Assistant resize handling (from Big Files View)
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

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Datos de ejemplo
  const duplicateItems = [
    {
      id: 1,
      name: "Fotos de vacaciones",
      type: "folder",
      count: 2,
      totalSize: 1.8 * 1024 * 1024 * 1024,
      fileCount: 124,
      recoverable: 921.6 * 1024 * 1024,
      copies: [
        {
          id: 101,
          path: "D:/Fotos/Vacaciones 2023",
          date: "15/08/2023",
          size: 1.8 * 1024 * 1024 * 1024,
          keep: true,
        },
        {
          id: 102,
          path: "E:/Backup/Fotos/Vacaciones 2023",
          date: "20/08/2023",
          size: 1.8 * 1024 * 1024 * 1024,
          keep: false,
        },
      ],
    },
    {
      id: 2,
      name: "Italia2023.mp4",
      type: "video",
      count: 3,
      totalSize: 3.5 * 1024 * 1024 * 1024,
      recoverable: 2.3 * 1024 * 1024 * 1024,
      copies: [
        {
          id: 201,
          path: "D:/Videos/Vacaciones/Italia2023.mp4",
          date: "12/05/2023",
          size: 3.5 * 1024 * 1024 * 1024,
          keep: true,
        },
        {
          id: 202,
          path: "C:/Users/User/Videos/Italia2023.mp4",
          date: "15/05/2023",
          size: 3.5 * 1024 * 1024 * 1024,
          keep: false,
        },
        {
          id: 203,
          path: "E:/Backup/Videos/Italia2023.mp4",
          date: "15/05/2023",
          size: 3.5 * 1024 * 1024 * 1024,
          keep: false,
        },
      ],
    },
    {
      id: 3,
      name: "IMG001.jpg",
      type: "image",
      count: 3,
      totalSize: 2.4 * 1024 * 1024,
      recoverable: 1.6 * 1024 * 1024,
      copies: [
        {
          id: 301,
          path: "C:/Users/User/Pictures/IMG001.jpg",
          date: "23/01/2022",
          size: 2.4 * 1024 * 1024,
          keep: true,
        },
        {
          id: 302,
          path: "D:/Photos/Family/IMG001.jpg",
          date: "23/01/2022",
          size: 2.4 * 1024 * 1024,
          keep: false,
        },
        {
          id: 303,
          path: "E:/Backup/Photos/2022/IMG001.jpg",
          date: "24/02/2022",
          size: 2.4 * 1024 * 1024,
          keep: false,
        },
      ],
    },
  ]

  // Add this constant after the duplicateItems declaration
  const availableDisks: Disk[] = [
    { id: "C", label: "Disco C:", path: "C:/", color: "blue", usedSpace: 325, totalSpace: 500 },
    { id: "D", label: "Disco D:", path: "D:/", color: "green", usedSpace: 750, totalSpace: 1000 },
    { id: "E", label: "Disco E:", path: "E:/", color: "yellow", usedSpace: 1200, totalSpace: 2000 },
    { id: "J", label: "Disco J:", path: "J:/", color: "purple", usedSpace: 400, totalSpace: 1000 },
  ]

  // Import formatSize from utils
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
  }

  // Calcular espacio total recuperable
  const totalRecoverable = duplicateItems.reduce((sum, item) => sum + item.recoverable, 0)

  // Obtener icono basado en el tipo
  const getItemIcon = (type: string) => {
    switch (type) {
      case "folder":
        return <Folder className="text-blue-500" />
      case "image":
        return <ImageIcon className="text-purple-500" />
      case "video":
        return <FileVideo className="text-red-500" />
      default:
        return <File className="text-gray-500" />
    }
  }

  // Componente para elementos desplegables
  const Collapsible = ({
    title,
    icon,
    children,
    isOpen,
    onToggle,
    defaultOpen = false,
  }: {
    title: string
    icon?: React.ReactNode
    children: React.ReactNode
    isOpen?: boolean
    onToggle?: () => void
    defaultOpen?: boolean
  }) => {
    const [open, setOpen] = useState(defaultOpen)
    const isControlled = isOpen !== undefined

    const handleToggle = () => {
      if (isControlled) {
        onToggle && onToggle()
      } else {
        setOpen(!open)
      }
    }

    const currentOpen = isControlled ? isOpen : open

    return (
      <div className="border-b border-gray-100 dark:border-gray-700 py-2">
        <div
          className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
          onClick={handleToggle}
        >
          <div className="flex items-center">
            {icon && <span className="mr-2">{icon}</span>}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="text-gray-400">{currentOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${currentOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"}`}
        >
          {children}
        </div>
      </div>
    )
  }

  // Ensure the handler functions for view mode changes are properly defined
  const handleViewModeChange = (mode: string) => {
    setViewMode(mode)
  }

  // Mock data for when API is not available
  const mockData = [
    {
      id: "1",
      filename: "documento.pdf",
      size: 1024 * 1024 * 2.5, // 2.5 MB
      modified: new Date().toISOString(),
      path: "C:/Users/Usuario/Documents/documento.pdf",
    },
    {
      id: "2",
      filename: "imagen.jpg",
      size: 1024 * 512, // 512 KB
      modified: new Date().toISOString(),
      path: "C:/Users/Usuario/Pictures/imagen.jpg",
    },
    {
      id: "3",
      filename: "video.mp4",
      size: 1024 * 1024 * 15, // 15 MB
      modified: new Date().toISOString(),
      path: "C:/Users/Usuario/Videos/video.mp4",
    },
  ]

  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteCount, setDeleteCount] = useState(0)
  const { toast } = useToast()

  // Mock delete function for demonstration
  const deleteDuplicatesFn = async (params: { ids: string[] }) => {
    // Mock deletion
    return new Promise((resolve) => setTimeout(resolve, 1000))
  }

  // Initialize data with mock data
  useEffect(() => {
    setData(mockData)
    setInitialDataLoaded(true)
  }, [isClient])

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "filename",
      header: "Nombre",
    },
    {
      accessorKey: "size",
      header: "Tamaño",
      cell: ({ row }) => {
        const sizeInBytes = row.original.size
        const sizeInKilobytes = sizeInBytes / 1024
        const sizeInMegabytes = sizeInKilobytes / 1024

        let displaySize
        let unit

        if (sizeInMegabytes >= 1) {
          displaySize = sizeInMegabytes.toFixed(2)
          unit = "MB"
        } else if (sizeInKilobytes >= 1) {
          displaySize = sizeInKilobytes.toFixed(2)
          unit = "KB"
        } else {
          displaySize = sizeInBytes.toFixed(2)
          unit = "Bytes"
        }

        return (
          <span>
            {displaySize} {unit}
          </span>
        )
      },
    },
    {
      accessorKey: "modified",
      header: "Modificado",
      cell: ({ row }) => {
        const date = new Date(row.original.modified)
        const formattedDate = format(date, "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es })
        return formattedDate
      },
    },
    {
      accessorKey: "path",
      header: "Ruta",
    },
  ]

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: (rowSelection) => {
      const selectedRowIds = Object.keys(rowSelection)
      setSelectedFiles(selectedRowIds)
    },
  })

  useEffect(() => {
    const count = table.getSelectedRowModel().rows.length
    setDeleteCount(count)
  }, [table.getSelectedRowModel().rows.length])

  const onDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteDuplicatesFn({ ids: selectedFiles })
      toast({
        title: "¡Éxito!",
        description: "Los archivos duplicados han sido eliminados.",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Ocurrió un error.",
        description: error.message,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Only render the component after client-side hydration
  if (!isClient || !initialDataLoaded) {
    return null // Return null during SSR to avoid hydration mismatch
  }

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden h-full dark:bg-gray-900 dark:text-white">
      {/* Left Panel - Chat with AI (from Big Files View) */}
      <div
        ref={chatRef}
        className="flex flex-col border-r border-border bg-card relative dark:bg-card dark:border-border"
        style={{
          width: chatCollapsed ? "40px" : `${chatWidth}px`,
          minWidth: chatCollapsed ? "40px" : "200px",
          maxWidth: chatCollapsed ? "40px" : "70%",
        }}
      >
        {/* Fix the inconsistent height of the dividing line in the AI Assistant section
        The issue is in the chat header section when collapsed */}

        {/* Replace the chat header section with this improved version that maintains consistent border height */}
        {/* Around line 380-395 (the AI Assistant header section) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!chatCollapsed ? (
            <>
              <div className="flex items-center">
                <MessageSquare size={18} className="mr-2" />
                <h2 className="font-medium">AI Assistant</h2>
              </div>
              <button
                onClick={() => setChatCollapsed(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <ChevronLeft size={20} className="text-gray-500 hover:text-gray-700 dark:text-gray-400" />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button
                onClick={() => setChatCollapsed(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <ChevronRight size={16} className="text-gray-500 hover:text-gray-700 dark:text-gray-400" />
              </button>
            </div>
          )}
        </div>

        {/* Replace the collapsed chat content section with this improved version */}
        {/* Around line 397-414 (the collapsed chat content section) */}
        {chatCollapsed && (
          <div className="flex-1 flex flex-col">
            <div className="absolute top-1/2 left-0 w-full">
              <span
                className="font-medium text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
                style={{
                  position: "absolute",
                  transform: "rotate(90deg)",
                  transformOrigin: "left center",
                  left: "20px",
                }}
              >
                AI Assistant
              </span>
            </div>
          </div>
        )}
        {!chatCollapsed ? (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 max-w-xs chat-message-user">
                  <p className="text-sm dark:text-white">
                    Encuentra los archivos duplicados en mi disco C: que no he usado en los últimos 6 meses
                  </p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-xs chat-message-ai">
                  <p className="text-sm dark:text-gray-100">
                    He analizado tu disco C: y encontré 15 archivos duplicados que no has usado en los últimos 6 meses.
                    El grupo más grande es "Fotos de vacaciones" con 2 copias idénticas. ¿Quieres ver la lista completa?
                  </p>
                </div>
              </div>

              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 max-w-xs chat-message-user">
                  <p className="text-sm dark:text-white">Sí, muéstrame la lista</p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-xs chat-message-ai">
                  <p className="text-sm dark:text-gray-100">
                    Aquí están los archivos duplicados sin usar en los últimos 6 meses:
                    <br />
                    <br />
                    1. Fotos de vacaciones (2 copias, 1.8GB)
                    <br />
                    2. Italia2023.mp4 (3 copias, 3.5GB)
                    <br />
                    3. IMG001.jpg (3 copias, 2.4MB)
                    <br />
                    <br />
                    ¿Quieres que te ayude a liberar espacio eliminando las copias innecesarias?
                  </p>
                </div>
              </div>

              {aiMessages.map((message, index) => (
                <div key={index} className={`${message.role === "assistant" ? "flex" : "flex justify-end"}`}>
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === "assistant"
                        ? "bg-gray-100 dark:bg-gray-700 max-w-xs chat-message-ai"
                        : "bg-blue-100 dark:bg-blue-900/50 max-w-xs chat-message-user"
                    }`}
                  >
                    <p className="text-sm dark:text-gray-100">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-2 chat-input">
                <Input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Escribe tu instrucción aquí..."
                  className="flex-1 bg-transparent outline-none text-sm border-none dark:text-gray-100 dark:placeholder-gray-400"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button
                  className="ml-2 text-[hsl(var(--color-info-blue))] dark:text-[hsl(var(--color-info-blue))]"
                  onClick={handleSendMessage}
                  disabled={!userInput.trim()}
                >
                  <ArrowRight size={20} />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Sugerencia: Puedes especificar fechas, tamaños o tipos de archivo en tus instrucciones
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Divisor redimensionable para el chat */}
      <div
        ref={chatResizeRef}
        className={`relative w-[1px] bg-gray-700 ${chatCollapsed ? "cursor-default" : "cursor-ew-resize"} flex-shrink-0 transition-colors`}
        onMouseDown={startResizingChat}
      >
        <div className="absolute inset-0 w-px bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"></div>
        {/* Área ampliada para mouseOver, invisible pero interactiva */}
        <div className="absolute inset-y-0 -left-2 -right-2"></div>
      </div>

      {/* Sidebar */}
      <div
        className={`border-r border-gray-700 bg-white flex flex-col transition-all duration-300 ease-in-out ${
          sidebarExpanded ? "w-72" : "w-16"
        } dark:bg-card`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {sidebarExpanded ? (
            <>
              <div className="flex items-center">
                <Copy size={18} className="mr-2" />
                <span className="font-medium">Duplicados</span>
              </div>
              <button
                onClick={() => setSidebarExpanded(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </>
          ) : (
            <button onClick={() => setSidebarExpanded(true)} className="w-full flex justify-center p-2">
              <ChevronRight size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>

        {!sidebarExpanded && (
          <div className="flex-1 flex items-center justify-center">
            <span
              className="font-medium text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
              style={{
                position: "absolute",
                transform: "rotate(90deg)",
                transformOrigin: "center",
                width: "max-content",
              }}
            >
              Duplicados
            </span>
          </div>
        )}

        {sidebarExpanded && (
          <div className="flex-1 overflow-y-auto">
            {/* Selector de discos - moved to the top */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <DiskSelector
                title="Discos Seleccionados"
                disks={availableDisks}
                selectedDisks={selectedDisks}
                onChange={setSelectedDisks}
                compact={!sidebarExpanded}
              />
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium mb-3">Acciones rápidas</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedView('enhanced')}
                >
                  <Zap className="mr-2" size={16} />
                  Vista mejorada
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedView('simple')}
                >
                  <List className="mr-2" size={16} />
                  Vista clásica
                </Button>
              </div>
            </div>

            {/* Espacio recuperable */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium dark:text-blue-300">Espacio recuperable</h3>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {formatSize(totalRecoverable)}
                  </span>
                </div>

                <button
                  className="w-full text-sm text-[hsl(var(--color-info-blue))] dark:text-[hsl(var(--color-info-blue))] flex items-center justify-center mt-2"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "Menos detalles" : "Más detalles"}
                  {showDetails ? (
                    <ChevronDown size={14} className="ml-1" />
                  ) : (
                    <ChevronRight size={14} className="ml-1" />
                  )}
                </button>

                {showDetails && (
                  <div className="mt-3 text-sm space-y-2 animate-fadeIn">
                    <div className="flex justify-between">
                      <span className="dark:text-gray-300">Elementos duplicados:</span>
                      <span className="dark:text-gray-300">{duplicateItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="dark:text-gray-300">Copias totales:</span>
                      <span className="dark:text-gray-300">
                        {duplicateItems.reduce((sum, item) => sum + item.count, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="dark:text-gray-300">Seleccionados:</span>
                      <span className="dark:text-gray-300">
                        {duplicateItems.reduce((sum, item) => sum + item.copies.filter((c) => !c.keep).length, 0)}
                      </span>
                    </div>

                    <div className="mt-2">
                      <h4 className="text-xs font-medium mb-1 dark:text-gray-300">Impacto por disco</h4>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        <div>
                          <div className="flex justify-between text-xs mb-0.5 dark:text-gray-400">
                            <span>C:</span>
                            <span>48.0 GB (10%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 w-[70%]"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-0.5 dark:text-gray-400">
                            <span>D:</span>
                            <span>120.0 GB (12%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 w-[60%]"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-0.5 dark:text-gray-400">
                            <span>E:</span>
                            <span>90.0 GB (5%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[45%]"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-0.5 dark:text-gray-400">
                            <span>J:</span>
                            <span>35.0 GB (3%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[30%]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vista */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Vista</h3>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
                  <button
                    className={`p-1 rounded ${viewMode === "list" ? "bg-white dark:bg-gray-600 shadow-sm" : ""}`}
                    onClick={() => setViewMode("list")}
                  >
                    <List size={16} />
                  </button>
                  <button
                    className={`p-1 rounded ${viewMode === "explorer" ? "bg-white dark:bg-gray-600 shadow-sm" : ""}`}
                    onClick={() => setViewMode("explorer")}
                  >
                    <Grid size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* ¿Qué copia conservar? - Fix for dark mode hover text */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Collapsible
                title="¿Qué copia conservar?"
                icon={<Star size={16} className="text-[hsl(var(--color-star-yellow))]" />}
                defaultOpen={true}
              >
                <div className="space-y-1 px-2">
                  <button
                    className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md ${
                      keepOption === "newest"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
                    }`}
                    onClick={() => setKeepOption("newest")}
                  >
                    <div
                      className={`w-4 h-4 mr-2 rounded-full border ${
                        keepOption === "newest"
                          ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                          : "border-gray-400 dark:border-gray-500"
                      } flex items-center justify-center`}
                    >
                      {keepOption === "newest" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    La más reciente
                  </button>

                  <button
                    className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md ${
                      keepOption === "original"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
                    }`}
                    onClick={() => setKeepOption("original")}
                  >
                    <div
                      className={`w-4 h-4 mr-2 rounded-full border ${
                        keepOption === "original"
                          ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                          : "border-gray-400 dark:border-gray-500"
                      } flex items-center justify-center`}
                    >
                      {keepOption === "original" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    La original (más antigua)
                  </button>

                  <button
                    className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md ${
                      keepOption === "manual"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
                    }`}
                    onClick={() => setKeepOption("manual")}
                  >
                    <div
                      className={`w-4 h-4 mr-2 rounded-full border ${
                        keepOption === "manual"
                          ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                          : "border-gray-400 dark:border-gray-500"
                      } flex items-center justify-center`}
                    >
                      {keepOption === "manual" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    Selección manual
                  </button>
                </div>
              </Collapsible>
            </div>

            {/* Tipo de elementos - Fix for dark mode hover text */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Collapsible title="Tipo de elementos" icon={<File size={16} />} defaultOpen={true}>
                <div className="space-y-1 px-2">
                  <button
                    className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md ${
                      selectedType === "all"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
                    }`}
                    onClick={() => setSelectedType("all")}
                  >
                    <div
                      className={`w-4 h-4 mr-2 rounded-full border ${
                        selectedType === "all"
                          ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                          : "border-gray-400 dark:border-gray-500"
                      } flex items-center justify-center`}
                    >
                      {selectedType === "all" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    Todos
                  </button>

                  <button
                    className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md ${
                      selectedType === "folders"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
                    }`}
                    onClick={() => setSelectedType("folders")}
                  >
                    <div
                      className={`w-4 h-4 mr-2 rounded-full border ${
                        selectedType === "folders"
                          ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                          : "border-gray-400 dark:border-gray-500"
                      } flex items-center justify-center`}
                    >
                      {selectedType === "folders" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <Folder size={14} className="mr-1.5" />
                    Carpetas
                  </button>

                  <button
                    className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md ${
                      selectedType === "files"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
                    }`}
                    onClick={() => setSelectedType("files")}
                  >
                    <div
                      className={`w-4 h-4 mr-2 rounded-full border ${
                        selectedType === "files"
                          ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                          : "border-gray-400 dark:border-gray-500"
                      } flex items-center justify-center`}
                    >
                      {selectedType === "files" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <File size={14} className="mr-1.5" />
                    Archivos
                  </button>

                  <button
                    className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md ${
                      selectedType === "images"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
                    }`}
                    onClick={() => setSelectedType("images")}
                  >
                    <div
                      className={`w-4 h-4 mr-2 rounded-full border ${
                        selectedType === "images"
                          ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                          : "border-gray-400 dark:border-gray-500"
                      } flex items-center justify-center`}
                    >
                      {selectedType === "images" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <ImageIcon size={14} className="mr-1.5" />
                    Imágenes
                  </button>

                  <button
                    className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md ${
                      selectedType === "videos"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-200"
                    }`}
                    onClick={() => setSelectedType("videos")}
                  >
                    <div
                      className={`w-4 h-4 mr-2 rounded-full border ${
                        selectedType === "videos"
                          ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                          : "border-gray-400 dark:border-gray-500"
                      } flex items-center justify-center`}
                    >
                      {selectedType === "videos" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <FileVideo size={14} className="mr-1.5" />
                    Videos
                  </button>
                </div>
              </Collapsible>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden h-full dark:bg-gray-900">
        {/* Show enhanced view if selected */}
        {selectedView === 'enhanced' ? (
          <div className="flex-1 overflow-auto p-6">
            <EnhancedDuplicates 
              selectedDisks={selectedDisks} 
              onDiskChange={setSelectedDisks}
            />
          </div>
        ) : (
          <>
        {/* Mobile AI Assistant Toggle */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Archivos duplicados</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChatCollapsed(!chatCollapsed)}
            className="flex items-center"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            {!chatCollapsed ? "Ocultar Asistente" : "Mostrar Asistente"}
          </Button>
        </div>

        {/* Guía rápida */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border-b border-blue-100 dark:border-blue-800">
          <div className="flex items-start">
            <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-2 mr-3 flex-shrink-0">
              <Info size={18} className="text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Guía rápida: Gestión de duplicados</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                Hemos encontrado varios elementos duplicados en tus discos. Por cada grupo, mantendremos automáticamente
                una copia (marcada en{" "}
                <span className="bg-[hsl(var(--color-success-green-bg))] dark:bg-[hsl(var(--color-success-green-bg))] px-2 py-0.5 rounded text-[hsl(var(--color-success-green-fg))] dark:text-[hsl(var(--color-success-green-fg))]">
                  verde
                </span>
                ) y eliminaremos el resto (marcado en{" "}
                <span className="bg-red-100 dark:bg-red-800 px-2 py-0.5 rounded text-red-800 dark:text-red-300">
                  rojo
                </span>
                ) si lo confirmas.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-blue-700 dark:text-blue-400">
                <div className="flex items-center">
                  <Star size={14} className="text-[hsl(var(--color-star-yellow))] mr-1" />
                  <span>Copia a conservar</span>
                </div>
                <div className="flex items-center">
                  <Trash2 size={14} className="text-red-500 mr-1" />
                  <span>Copia a eliminar</span>
                </div>
                <div className="flex items-center">
                  <Eye size={14} className="text-purple-500 mr-1" />
                  <span>Vista previa</span>
                </div>
                <div className="flex items-center">
                  <FolderOpen size={14} className="text-blue-500 mr-1" />
                  <span>Abrir ubicación</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header de contenido */}
        <div className="bg-card dark:bg-card px-4 py-3 border-b border-border dark:border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium dark:text-white">Archivos y carpetas duplicados</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {duplicateItems.length} elementos • {formatSize(totalRecoverable)} recuperables
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="flex items-center md:hidden"
                onClick={() => setChatCollapsed(!chatCollapsed)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {!chatCollapsed ? "Ocultar Asistente" : "Mostrar Asistente"}
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de duplicados */}
        <div className="flex-1 overflow-auto p-3 min-h-0">
          <div className="space-y-3">
            {duplicateItems.map((item) => (
              <Card key={item.id} className="overflow-hidden dark:bg-card dark:border-border">
                {/* Cabecera del grupo */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setExpandedGroup(expandedGroup === item.id ? null : item.id)}
                >
                  <div className="flex items-center">
                    {getItemIcon(item.type)}
                    <div className="ml-3">
                      <div className="font-medium dark:text-white">{item.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.count} copias • {formatSize(item.totalSize)}
                        {item.type === "folder" && ` • ${item.fileCount} archivos`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="text-green-600 dark:text-green-400 mr-3 text-sm">
                      {formatSize(item.recoverable)} recuperables
                    </span>
                    {expandedGroup === item.id ? (
                      <ChevronDown size={20} className="text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Contenido expandido */}
                {expandedGroup === item.id && (
                  <div className="border-t border-gray-100 dark:border-gray-700">
                    {item.copies.map((copy) => (
                      <div
                        key={copy.id}
                        className={`p-3 ${copy.keep ? "bg-green-50 dark:bg-green-900/30" : "bg-red-50 dark:bg-red-900/30"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <div className="mr-3">
                              {copy.keep ? (
                                <div className="w-6 h-6 rounded-full bg-[hsl(var(--color-success-green-bg))] dark:bg-[hsl(var(--color-success-green-bg))] flex items-center justify-center">
                                  <Star size={14} className="text-[hsl(var(--color-star-yellow))]" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
                                  <Trash2 size={14} className="text-red-500" />
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="font-medium dark:text-white">{copy.path}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Modificado: {copy.date} • {formatSize(copy.size)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {!copy.keep && (
                              <button className="text-[hsl(var(--color-info-blue))] dark:text-[hsl(var(--color-info-blue))] text-sm hover:underline flex items-center">
                                <Star size={14} className="mr-1 text-[hsl(var(--color-star-yellow))]" />
                                Conservar esta
                              </button>
                            )}

                            <button className="p-1.5 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                              <FolderOpen size={18} />
                            </button>

                            {!copy.keep && (
                              <button className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Barra de acciones inferior */}
        <div className="bg-card dark:bg-card px-4 py-3 border-t border-border dark:border-border flex items-center justify-between sticky bottom-0 z-10">
          <div className="text-sm flex items-center">
            <span className="font-medium dark:text-white">7 elementos seleccionados</span>
            <span className="ml-2 text-gray-500 dark:text-gray-400">({formatSize(totalRecoverable)} recuperables)</span>

            <div className="ml-4 flex items-center">
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-3/4"></div>
              </div>
              <span className="ml-2 text-xs text-green-600 dark:text-green-400">75% del total recuperable</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm flex items-center dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <ChevronLeft size={16} className="mr-1.5" />
              Deshacer
            </button>

            <button className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm flex items-center hover:bg-red-700">
              <Trash2 size={16} className="mr-1.5" />
              Eliminar elementos seleccionados (7)
            </button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  )
}

export default DuplicatesView
