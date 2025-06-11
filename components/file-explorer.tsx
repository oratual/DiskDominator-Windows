import React from "react";
import React from "react";
"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Clock,
  Star,
  Home,
  ChevronDown,
  Download,
  Monitor,
  ImageIcon,
  Music,
  Film,
  Package,
  ChevronLeft,
  RefreshCw,
  List,
  Grid,
  Computer,
} from "lucide-react"

// Custom ExpandIcon component for better interactive dropdown arrows
const ExpandIcon = ({ expanded, onClick }: { expanded: boolean; onClick: (e: React.MouseEvent) => void }) => {
  return (
    <div
      onClick={onClick}
      className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors cursor-pointer"
    >
      {expanded ? (
        <ChevronDown size={16} className="text-blue-600 dark:text-blue-400" />
      ) : (
        <ChevronRight size={16} className="text-blue-600 dark:text-blue-400" />
      )}
    </div>
  )
}

// Tipo para las secciones expandibles
type ExpandedSections = {
  quickAccess: boolean
  thisPC: boolean
  driveC: boolean
  driveD: boolean
  driveE: boolean
  driveJ: boolean
}

// Props para el componente FileExplorer
interface FileExplorerProps {
  initialPath?: string
  compact?: boolean
  onPathChange?: (path: string) => void
  minWidth?: number
  maxWidth?: number
  allowExternalDrop?: boolean
  onSelectionChange?: (selectedItems: FileItem[]) => void
  viewModeOptions?: boolean
  showDriveCheckboxes?: boolean // New prop to control checkbox visibility on drives
}

// Define destination types for better organization
type DestinationType = "recent" | "favorite" | "drive" | "folder" | "special"

// Interface for destination items
interface Destination {
  path: string
  name: string
  icon: React.ReactNode
  type: DestinationType
  description?: string
  isRecommended?: boolean
}

// Interface for file items
export interface FileItem {
  name: string
  path: string
  type: string
  size?: number
  modified?: string
  isDirectory: boolean
  created?: string
  accessed?: string
  owner?: string
  id: string
  children?: FileItem[]
  favorite?: boolean
}

// Quick access items with consistent iconography
const quickAccessItems = [
  {
    name: "Descargas",
    path: "C:/Users/User/Downloads/",
    icon: <Download size={16} className="text-purple-500 dark:text-purple-400" />,
    id: "downloads",
    type: "folder",
    isDirectory: true,
  },
  {
    name: "Documentos",
    path: "C:/Users/User/Documents/",
    icon: <FileText size={16} className="text-blue-500 dark:text-blue-400" />,
    id: "documents",
    type: "folder",
    isDirectory: true,
  },
  {
    name: "Escritorio",
    path: "C:/Users/User/Desktop/",
    icon: <Monitor size={16} className="text-green-500 dark:text-green-400" />,
    id: "desktop",
    type: "folder",
    isDirectory: true,
  },
  {
    name: "Imágenes",
    path: "C:/Users/User/Pictures/",
    icon: <ImageIcon size={16} className="text-pink-500 dark:text-pink-400" />,
    id: "pictures",
    type: "folder",
    isDirectory: true,
  },
  {
    name: "Música",
    path: "C:/Users/User/Music/",
    icon: <Music size={16} className="text-red-500 dark:text-red-400" />,
    id: "music",
    type: "folder",
    isDirectory: true,
  },
  {
    name: "Objetos 3D",
    path: "C:/Users/User/3D Objects/",
    icon: <Package size={16} className="text-amber-500 dark:text-amber-400" />,
    id: "3dobjects",
    type: "folder",
    isDirectory: true,
  },
  {
    name: "Videos",
    path: "C:/Users/User/Videos/",
    icon: <Film size={16} className="text-indigo-500 dark:text-indigo-400" />,
    id: "videos",
    type: "folder",
    isDirectory: true,
  },
]

export default function FileExplorer({
  initialPath = "C:/",
  compact = false,
  onPathChange,
  minWidth = 150,
  maxWidth = 450,
  allowExternalDrop = true,
  onSelectionChange,
  viewModeOptions = true,
  showDriveCheckboxes = false, // Default to false for backward compatibility
}: FileExplorerProps) {
  // Estados para el explorador
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [viewMode, setViewMode] = useState("details") // "list", "icons"
  const [iconSize, setIconSize] = useState("medium") // "small", "medium", "large"
  const [showIconSizeMenu, setShowIconSizeMenu] = useState(false)
  // Estados para el redimensionamiento
  const [navWidth, setNavWidth] = useState(compact ? 200 : 260)
  const [isResizing, setIsResizing] = useState(false)
  const [initialMouseX, setInitialMouseX] = useState(0)
  const [initialNavWidth, setInitialNavWidth] = useState(compact ? 200 : 260)
  const [minNavWidth, setMinNavWidth] = useState(0)
  const [maxNavWidth, setMaxNavWidth] = useState(0)
  const [showSizeIndicator, setShowSizeIndicator] = useState(false)
  const [sizeIndicatorPosition, setSizeIndicatorPosition] = useState({ x: 0, y: 0 })
  const [currentSize, setCurrentSize] = useState(0)
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    quickAccess: true,
    thisPC: true,
    driveC: true,
    driveD: true,
    driveE: true,
    driveJ: false,
  })

  // Breadcrumb states
  const [isEditingPath, setIsEditingPath] = useState(false)
  const [editPathValue, setEditPathValue] = useState("")
  const [pathError, setPathError] = useState<string | null>(null)
  const [showBreadcrumbMenu, setShowBreadcrumbMenu] = useState(false)
  const [breadcrumbMenuPosition, setBreadcrumbMenuPosition] = useState({ x: 0, y: 0 })

  // Context menu states
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    targetType: "file" | "folder" | "drive" | "empty" | null
    targetName: string | null
    targetPath: string | null
  }>({
    visible: false,
    x: 0,
    y: 0,
    targetType: null,
    targetName: null,
    targetPath: null,
  })

  // Dialog states
  const [fileOperationDialog, setFileOperationDialog] = useState<{
    visible: boolean
    type: "confirm" | "input" | "select"
    title: string
    message?: string
    inputLabel?: string
    inputValue?: string
    selectOptions?: { value: string; label: string }[]
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    onConfirm: (value?: string) => void
  }>({
    visible: false,
    type: "confirm",
    title: "",
    onConfirm: () => {},
  })

  // File properties dialog state
  const [propertiesDialog, setPropertiesDialog] = useState<{
    visible: boolean
    fileInfo: FileItem | null
  }>({
    visible: false,
    fileInfo: null,
  })

  // Clipboard state
  const [clipboard, setClipboard] = useState<{ action: "copy" | "cut"; item: FileItem } | null>(null)
  const [recentLocations, setRecentLocations] = useState<{ name: string; path: string }[]>([
    { name: "Documents", path: "/C:/Users/User/Documents" },
    { name: "Downloads", path: "/C:/Users/User/Downloads" },
    { name: "Desktop", path: "/C:/Users/User/Desktop" },
  ])
  const [favoriteLocations, setFavoriteLocations] = useState<{ name: string; path: string }[]>([
    { name: "Projects", path: "/C:/Users/User/Projects" },
    { name: "Pictures", path: "/C:/Users/User/Pictures" },
  ])

  // Añadir estos estados adicionales para manejar el arrastrar y soltar
  const [draggingItem, setDraggingItem] = useState<string | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)
  const [draggedFiles, setDraggedFiles] = useState<string[]>([])
  const [draggedItemType, setDraggedItemType] = useState<string | null>(null)

  // Add state for external file dropping
  const [isExternalDropping, setIsExternalDropping] = useState(false)
  const [externalDropTarget, setExternalDropTarget] = useState<string | null>(null)
  const [dropOperation, setDropOperation] = useState<"move" | "copy">("move")

  // Añadir estos estados para el menú contextual
  const [showContextMenuState, setShowContextMenuState] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [contextMenuTarget, setContextMenuTarget] = useState<string | null>(null)
  const [contextMenuTargetType, setContextMenuTargetType] = useState<string | null>(null)
  const [contextMenuTargetName, setContextMenuTargetName] = useState<string | null>(null)

  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<DestinationType | "all">("all")
  const [showDestinationPreview, setShowDestinationPreview] = useState(false)
  const [previewPath, setPreviewPath] = useState("")

  // Estado para los archivos en la carpeta actual
  const [currentFiles, setCurrentFiles] = useState<FileItem[]>([])

  // Recent destinations history
  const [recentDestinations, setRecentDestinations] = useState<string[]>([
    "E:/antiguo unreal/",
    "J:/proyectos/unreal/",
    "C:/Proyectos/",
  ])

  // Favorite destinations
  const [favoriteDestinations, setFavoriteDestinations] = useState<string[]>(["E:/antiguo unreal/", "J:/proyectos/"])

  // Multi-selection states
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // New file/folder creation states
  const [showNewItemDialog, setShowNewItemDialog] = useState(false)
  const [newItemType, setNewItemType] = useState<"file" | "folder">("file")
  const [newItemName, setNewItemName] = useState("")

  // Cargar selección guardada al iniciar
  useEffect(() => {
    try {
      const savedSelection = localStorage.getItem("fileExplorer_selectedItems")
      if (savedSelection) {
        setSelectedItems(JSON.parse(savedSelection))
      }
    } catch (error) {
      console.error("Error loading saved selection:", error)
    }
  }, [])

  // Guardar selección cuando cambia
  useEffect(() => {
    try {
      localStorage.setItem("fileExplorer_selectedItems", JSON.stringify(selectedItems))
    } catch (error) {
      console.error("Error saving selection:", error)
    }
  }, [selectedItems])

  const [lastSelectedItem, setLastSelectedItem] = useState<string | null>(null)
  const [isRubberBanding, setIsRubberBanding] = useState(false)
  const [rubberBandStart, setRubberBandStart] = useState({ x: 0, y: 0 })
  const [rubberBandEnd, setRubberBandEnd] = useState({ x: 0, y: 0 })
  const [showSelectionActions, setShowSelectionActions] = useState(false)
  const [selectionActionPosition, setSelectionActionPosition] = useState({ x: 0, y: 0 })

  const resizeRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const fileListRef = useRef<HTMLDivElement>(null)
  const newItemInputRef = useRef<HTMLInputElement>(null)
  const breadcrumbInputRef = useRef<HTMLInputElement>(null)
  const breadcrumbContainerRef = useRef<HTMLDivElement>(null)

  // Add these new state variables after the existing state declarations
  const [showDragNotification, setShowDragNotification] = useState(false)
  const [dragSource, setDragSource] = useState<string | null>(null)
  const [dragDestination, setDragDestination] = useState<string | null>(null)
  const [showDragOverMenu, setShowDragOverMenu] = useState(false)
  const [dragOverMenuPosition, setDragOverMenuPosition] = useState({ x: 0, y: 0 })
  const [dragOverTimer, setDragOverTimer] = useState<NodeJS.Timeout | null>(null)
  const [dragOperation, setDragOperation] = useState<"move" | "copy">("move")

  // Add this state for icon size change notification after the other state declarations
  const [showIconSizeNotification, setShowIconSizeNotification] = useState(false)
  const [iconSizeNotificationText, setIconSizeNotificationText] = useState("")

  // Añadir un mensaje de notificación cuando se completa una operación de arrastrar y soltar
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null)

  // Function to show notification messages
  const showNotificationMessage = (message: string, type: string) => {
    showNotification(message, type)
  }

  // Añadir un mensaje de notificación cuando se completa una operación de arrastrar y soltar
  const showNotification = (message: string, type: string) => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3000) // La notificación desaparece después de 3 segundos
  }

  // Handle breadcrumb context menu
  const handleBreadcrumbContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setBreadcrumbMenuPosition({ x: e.clientX, y: e.clientY })
    setShowBreadcrumbMenu(true)
  }

  // Handle breadcrumb menu actions
  const handleBreadcrumbMenuAction = (action: string) => {
    setShowBreadcrumbMenu(false)

    switch (action) {
      case "copy":
        navigator.clipboard.writeText(currentPath)
        showNotification("Path copied to clipboard", "success")
        break

      case "paste-go":
        navigator.clipboard
          .readText()
          .then((text) => {
            // Basic validation - check if it looks like a path
            if (text && (text.includes("/") || text.includes("\\"))) {
              // Normalize path separators
              const normalizedPath = text.replace(/\\/g, "/")
              // Ensure path ends with a slash
              const pathWithSlash = normalizedPath.endsWith("/") ? normalizedPath : normalizedPath + "/"
              changePath(pathWithSlash)
            } else {
              showNotification("Invalid path in clipboard", "error")
            }
          })
          .catch((err) => {
            console.error("Failed to read clipboard:", err)
            showNotification("Failed to read clipboard", "error")
          })
        break

      case "paste":
        navigator.clipboard
          .readText()
          .then((text) => {
            setIsEditingPath(true)
            setEditPathValue(text)
            setTimeout(() => {
              breadcrumbInputRef.current?.focus()
              breadcrumbInputRef.current?.select()
            }, 0)
          })
          .catch((err) => {
            console.error("Failed to read clipboard:", err)
            showNotification("Failed to read clipboard", "error")
          })
        break

      case "edit":
        setIsEditingPath(true)
        setEditPathValue(currentPath)
        setTimeout(() => {
          breadcrumbInputRef.current?.focus()
          breadcrumbInputRef.current?.select()
        }, 0)
        break
    }
  }

  // Handle path editing
  const handlePathInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const path = editPathValue.trim()

      // Basic validation
      if (!path) {
        setPathError("Path cannot be empty")
        return
      }

      // Normalize path separators
      const normalizedPath = path.replace(/\\/g, "/")

      // Ensure path ends with a slash
      const pathWithSlash = normalizedPath.endsWith("/") ? normalizedPath : normalizedPath + "/"

      // Simulate path validation (in a real app, you'd check if the path exists)
      const validPaths = [
        "C:/",
        "C:/Proyectos/",
        "C:/Users/",
        "C:/Windows/",
        "C:/Program Files/",
        "D:/",
        "D:/Unreal Projects/",
        "D:/Games/",
        "D:/Backup/",
        "E:/",
        "E:/antiguo unreal/",
        "E:/Media/",
        "J:/",
        "J:/proyectos/",
        "J:/Steam/",
        "J:/proyectos/unreal/",
        "J:/proyectos/web/",
      ]

      if (validPaths.includes(pathWithSlash)) {
        changePath(pathWithSlash)
        setIsEditingPath(false)
        setPathError(null)
      } else {
        setPathError(`Path not found: ${pathWithSlash}`)
        // Keep the input field open so the user can correct the path
      }
    } else if (e.key === "Escape") {
      setIsEditingPath(false)
      setPathError(null)
    }
  }

  // Close breadcrumb menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showBreadcrumbMenu && !breadcrumbContainerRef.current?.contains(e.target as Node)) {
        setShowBreadcrumbMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showBreadcrumbMenu])

  // Handle context menu actions
  const handleContextMenuAction = (action: string, targetPath: string | null) => {
    setContextMenu((prev) => ({ ...prev, visible: false }))

    switch (action) {
      case "open":
        if (targetPath) {
          const fileType = getFileType(targetPath)
          if (fileType === "folder" || targetPath.endsWith("/")) {
            changePath(targetPath)
          } else {
            showNotification(`Opening file: ${targetPath.split("/").pop()}`, "success")
          }
        }
        break

      case "openWith":
        setFileOperationDialog({
          visible: true,
          type: "select",
          title: "Open with",
          message: `Choose an application to open ${targetPath?.split("/").pop()}`,
          selectOptions: [
            { value: "notepad", label: "Notepad" },
            { value: "wordpad", label: "WordPad" },
            { value: "browser", label: "Web Browser" },
            { value: "custom", label: "Choose another app..." },
          ],
          confirmLabel: "Open",
          onConfirm: (app) => {
            showNotification(`Opening ${targetPath?.split("/").pop()} with ${app}`, "success")
            setFileOperationDialog((prev) => ({ ...prev, visible: false }))
          },
        })
        break

      case "copyPath":
        if (targetPath) {
          navigator.clipboard.writeText(targetPath)
          showNotification("Path copied to clipboard", "success")
        }
        break

      case "rename":
        if (targetPath) {
          const fileName = targetPath.split("/").pop() || ""
          setFileOperationDialog({
            visible: true,
            type: "input",
            title: "Rename",
            inputLabel: "New name:",
            inputValue: fileName,
            confirmLabel: "Rename",
            onConfirm: (newName) => {
              if (newName && newName !== fileName) {
                // Simulate renaming
                const parentPath = targetPath.substring(0, targetPath.lastIndexOf("/") + 1)
                const newPath = parentPath + newName

                // Update file in current files
                setCurrentFiles((prev) =>
                  prev.map((file) => {
                    if (file.path === targetPath) {
                      return { ...file, name: newName, path: newPath }
                    }
                    return file
                  }),
                )

                showNotification(`Renamed to ${newName}`, "success")
              }
              setFileOperationDialog((prev) => ({ ...prev, visible: false }))
            },
          })
        }
        break

      case "moveTo":
      case "copyTo":
        if (targetPath) {
          const isMove = action === "moveTo"
          setFileOperationDialog({
            visible: true,
            type: "select",
            title: isMove ? "Move to" : "Copy to",
            selectOptions: [
              ...recentDestinations.map((path) => ({
                value: path,
                label: `${path.split("/").pop() || path} (recent)`,
              })),
              ...favoriteDestinations.map((path) => ({
                value: path,
                label: `${path.split("/").pop() || path} (favorite)`,
              })),
            ],
            confirmLabel: isMove ? "Move" : "Copy",
            onConfirm: (destination) => {
              if (destination) {
                showNotification(
                  `${isMove ? "Moved" : "Copied"} ${targetPath.split("/").pop()} to ${destination}`,
                  "success",
                )

                // If it was a move, remove from current files
                if (isMove) {
                  setCurrentFiles((prev) => prev.filter((file) => file.path !== targetPath))
                }
              }
              setFileOperationDialog((prev) => ({ ...prev, visible: false }))
            },
          })
        }
        break

      case "newFile":
      case "newFolder":
        const isFile = action === "newFile"
        setFileOperationDialog({
          visible: true,
          type: "input",
          title: isFile ? "New File" : "New Folder",
          inputLabel: isFile ? "File name:" : "Folder name:",
          inputValue: isFile ? "New File.txt" : "New Folder",
          confirmLabel: "Create",
          onConfirm: (name) => {
            if (name) {
              const parentPath = targetPath || currentPath
              const newPath = `${parentPath}${parentPath.endsWith("/") ? "" : "/"}${name}`

              // Add new item to current files
              setCurrentFiles((prev) => [
                ...prev,
                {
                  name,
                  path: newPath,
                  type: isFile ? "file" : "folder",
                  isDirectory: !isFile,
                  size: isFile ? 0 : undefined,
                  modified: new Date().toLocaleDateString(),
                  created: new Date().toLocaleDateString(),
                  owner: "Current User",
                  id: Math.random().toString(36).substring(2, 15),
                },
              ])

              showNotification(`${isFile ? "File" : "Folder"} created: ${name}`, "success")
            }
            setFileOperationDialog((prev) => ({ ...prev, visible: false }))
          },
        })
        break

      case "delete":
        if (targetPath) {
          const fileName = targetPath.split("/").pop() || ""
          setFileOperationDialog({
            visible: true,
            type: "confirm",
            title: "Delete Confirmation",
            message: `Are you sure you want to delete "${fileName}"?`,
            confirmLabel: "Delete",
            cancelLabel: "Cancel",
            danger: true,
            onConfirm: () => {
              // Remove from current files
              setCurrentFiles((prev) => prev.filter((file) => file.path !== targetPath))
              showNotification(`Deleted: ${fileName}`, "success")
              setFileOperationDialog((prev) => ({ ...prev, visible: false }))
            },
          })
        }
        break

      case "properties":
        if (targetPath) {
          // Find file in current files
          const file = currentFiles.find((f) => f.path === targetPath)
          if (file) {
            setPropertiesDialog({
              visible: true,
              fileInfo: {
                ...file,
                created: file.created || new Date().toLocaleDateString(),
                accessed: new Date().toLocaleDateString(),
                owner: file.owner || "Current User",
              },
            })
          }
        }
        break

      case "download":
        if (targetPath) {
          showNotification(`Downloading: ${targetPath.split("/").pop()}`, "success")
        }
        break

      case "paste":
        if (!clipboard) return; // Add this null check
        if (clipboard.action && clipboard.item) {
          const targetDir = targetPath || currentPath
          const fileName = clipboard.item.name
          const newPath = `${targetDir}${targetDir.endsWith("/") ? "" : "/"}${fileName}`

          // Simulate paste operation
          // If it's a cut operation, remove from source
          if (clipboard.action === "cut") {
            setCurrentFiles((prev) => prev.filter((file) => file.path !== clipboard.item.path))
          }

          // Add to destination if not already there
          const fileExists = currentFiles.some((file) => file.path === newPath)
          if (!fileExists && targetDir === currentPath) {
            setCurrentFiles((prev) => [
              ...prev,
              {
                ...clipboard.item,
                path: newPath,
              },
            ])
          }

          showNotification(`${clipboard.action === "cut" ? "Moved" : "Copied"} ${fileName}`, "success")

          // Clear clipboard if it was a cut operation
          if (clipboard.action === "cut") {
            setClipboard(null)
          }
        }
        break

      case "moreDestinations":
        // Show the full destination dialog
        const suggestions = generateDestinationSuggestions("", selectedItems[0] || contextMenuTarget || "")
        setDestinations(suggestions)
        setShowDestinationPreview(true)
        break
    }
  }

  // Show context menu with accurate positioning
  const handleShowContextMenu = (
    e: React.MouseEvent,
    targetType: "file" | "folder" | "drive" | "empty",
    targetPath: string | null = null,
    targetName: string | null = null,
  ) => {
    e.preventDefault()
    e.stopPropagation()

    // If clicking on empty space
    if (targetType === "empty") {
      setSelectedItems([])
    }
    // If clicking on an item that's not selected, select it
    else if (targetPath && !selectedItems.includes(targetPath)) {
      setSelectedItems([targetPath])
    }

    // Get the mouse position relative to the viewport
    const x = e.clientX
    const y = e.clientY

    setContextMenu({
      visible: true,
      x,
      y,
      targetType,
      targetName: targetName || (targetPath ? targetPath.split("/").pop() || null : null),
      targetPath,
    })
  }

  // Handle right-click on empty space
  const handleEmptyAreaContextMenu = (e: React.MouseEvent) => {
    // Only handle if the click is directly on the container, not on a file item
    if (e.target === e.currentTarget) {
      handleShowContextMenu(e, "empty", currentPath, null)
    }
  }

  // Función para cambiar la ruta actual
  const changePath = (path: string) => {
    setCurrentPath(path)
    loadFilesForPath(path)

    // Eliminamos la limpieza de selección al cambiar de ruta
    // setSelectedItems([])
    // setLastSelectedItem(null)

    if (onPathChange) {
      onPathChange(path)
    }

    // Store current view settings in localStorage to persist them
    try {
      localStorage.setItem("fileExplorer_viewMode", viewMode)
      localStorage.setItem("fileExplorer_iconSize", iconSize)
    } catch (error) {
      console.error("Error saving view settings:", error)
    }
  }

  // Función para cargar archivos de una ruta
  const loadFilesForPath = (path: string) => {
    // Simulamos la carga de archivos según la ruta
    let files: FileItem[] = []

    if (path === "C:/") {
      files = [
        {
          name: "Proyectos",
          path: "C:/Proyectos/",
          type: "folder",
          isDirectory: true,
          modified: "15/03/2024 10:30",
          id: "c-proyectos",
        },
        {
          name: "Users",
          path: "C:/Users/",
          type: "folder",
          isDirectory: true,
          modified: "10/01/2024 08:15",
          id: "c-users",
        },
        {
          name: "Windows",
          path: "C:/Windows/",
          type: "folder",
          isDirectory: true,
          modified: "01/01/2024 00:00",
          id: "c-windows",
        },
        {
          name: "Program Files",
          path: "C:/Program Files/",
          type: "folder",
          isDirectory: true,
          modified: "01/01/2024 00:00",
          id: "c-programfiles",
        },
      ]
    } else if (path === "C:/Proyectos/") {
      files = [
        {
          name: "UE5_RPG (2019)",
          path: "C:/Proyectos/UE5_RPG (2019)",
          type: "unreal",
          isDirectory: false,
          size: 4.2 * 1024 * 1024 * 1024,
          modified: "03/05/2019 14:22",
          id: "ue5-rpg",
        },
        {
          name: "UE4_Shooter (2020)",
          path: "C:/Proyectos/UE4_Shooter (2020)",
          type: "unreal",
          isDirectory: false,
          size: 2.8 * 1024 * 1024 * 1024,
          modified: "12/11/2020 09:45",
          id: "ue4-shooter",
        },
        {
          name: "UE5_Platformer (2023)",
          path: "C:/Proyectos/UE5_Platformer (2023)",
          type: "unreal",
          isDirectory: false,
          size: 3.1 * 1024 * 1024 * 1024,
          modified: "04/12/2023 16:30",
          id: "ue5-platformer",
        },
      ]
    } else if (path === "D:/") {
      files = [
        {
          name: "Unreal Projects",
          path: "D:/Unreal Projects/",
          type: "folder",
          isDirectory: true,
          modified: "20/02/2024 14:45",
          id: "d-unrealprojects",
        },
        {
          name: "Games",
          path: "D:/Games/",
          type: "folder",
          isDirectory: true,
          modified: "15/02/2024 18:20",
          id: "d-games",
        },
        {
          name: "Backup",
          path: "D:/Backup/",
          type: "folder",
          isDirectory: true,
          modified: "01/03/2024 09:10",
          id: "d-backup",
        },
      ]
    } else if (path === "D:/Unreal Projects/") {
      files = [
        {
          name: "UE4_RTS (2021)",
          path: "D:/Unreal Projects/UE4_RTS (2021)",
          type: "unreal",
          isDirectory: false,
          size: 3.5 * 1024 * 1024 * 1024,
          modified: "06/14/2021 11:20",
          id: "ue4-rts",
        },
        {
          name: "UE4_Racing (2018)",
          path: "D:/Unreal Projects/UE4_Racing (2018)",
          type: "unreal",
          isDirectory: false,
          size: 5.7 * 1024 * 1024 * 1024,
          modified: "09/22/2018 15:10",
          id: "ue4-racing",
        },
        {
          name: "UE5_FPS (2024)",
          path: "D:/Unreal Projects/UE5_FPS (2024)",
          type: "unreal",
          isDirectory: false,
          size: 4.9 * 1024 * 1024 * 1024,
          modified: "01/15/2024 10:05",
          id: "ue5-fps",
        },
      ]
    } else if (path === "E:/") {
      files = [
        {
          name: "antiguo unreal",
          path: "E:/antiguo unreal/",
          type: "folder",
          isDirectory: true,
          modified: "01/04/2024 09:15",
          id: "e-antigoureal",
        },
        {
          name: "Media",
          path: "E:/Media/",
          type: "folder",
          isDirectory: true,
          modified: "10/03/2024 14:30",
          id: "e-media",
        },
      ]
    } else if (path === "J:/") {
      files = [
        {
          name: "proyectos",
          path: "J:/proyectos/",
          type: "folder",
          isDirectory: true,
          modified: "01/04/2024 09:15",
          id: "j-proyectos",
        },
        {
          name: "Steam",
          path: "J:/Steam/",
          type: "folder",
          isDirectory: true,
          modified: "15/03/2024 18:45",
          id: "j-steam",
        },
      ]
    } else if (path === "J:/proyectos/") {
      files = [
        {
          name: "unreal",
          path: "J:/proyectos/unreal/",
          type: "folder",
          isDirectory: true,
          modified: "01/04/2024 09:15",
          id: "j-proyectos-unreal",
        },
        {
          name: "web",
          path: "J:/proyectos/web/",
          type: "folder",
          isDirectory: true,
          modified: "20/03/2024 11:30",
          id: "j-proyectos-web",
        },
      ]
    } else if (path === "E:/antiguo unreal/") {
      // Esta carpeta estaría vacía inicialmente
      files = []
    } else if (path === "J:/proyectos/unreal/") {
      // Esta carpeta estaría vacía inicialmente
      files = []
    } else if (path.startsWith("C:/Users/User/")) {
      // Handle quick access folders
      const folderName = path.split("/").filter(Boolean).pop() || ""
      files = [
        {
          name: `Example ${folderName} File 1`,
          path: `${path}Example ${folderName} File 1.txt`,
          type: "document",
          isDirectory: false,
          size: 1024 * 10,
          modified: "01/04/2024 09:15",
          id: `example-${folderName}-file1`,
        },
        {
          name: `Example ${folderName} File 2`,
          path: `${path}Example ${folderName} File 2.txt`,
          type: "document",
          isDirectory: false,
          size: 1024 * 5,
          modified: "02/04/2024 10:20",
          id: `example-${folderName}-file2`,
        },
        {
          name: `${folderName} Subfolder`,
          path: `${path}${folderName} Subfolder/`,
          type: "folder",
          isDirectory: true,
          modified: "03/04/2024 11:30",
          id: `${folderName}-subfolder`,
        },
      ]
    }

    setCurrentFiles(files)
  }

  // Cargar archivos iniciales
  useEffect(() => {
    loadFilesForPath(initialPath)
  }, [initialPath])

  // Notify parent component when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedFileItems = currentFiles.filter((file) => selectedItems.includes(file.path))
      onSelectionChange(selectedFileItems)
    }
  }, [selectedItems, currentFiles, onSelectionChange])

  // Get file extension from path
  const getFileExtension = (path: string): string => {
    const parts = path.split(".")
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ""
  }

  // Get file type based on extension or path
  const getFileType = (path: string): string => {
    if (path.includes("/")) {
      const fileName = path.split("/").pop() || ""

      // Check if it's a folder
      if (!fileName.includes(".")) {
        return "folder"
      }

      // Check file extension
      const ext = getFileExtension(fileName)

      if (ext === "mp4" || ext === "avi" || ext === "mov") return "video"
      if (ext === "jpg" || ext === "png" || ext === "gif") return "image"
      if (ext === "doc" || ext === "docx" || ext === "txt") return "document"
      if (ext === "zip" || ext === "rar" || ext === "7z") return "archive"
      if (ext === "exe" || ext === "msi") return "executable"
      if (path.toLowerCase().includes("unreal")) return "unreal"

      return "file"
    }

    return "unknown"
  }

  // Función para formatear tamaños
  const formatSize = (bytes?: number): string => {
    if (bytes === undefined) return "-"
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
  }

  // Generate intelligent destination suggestions based on the dragged item
  const generateDestinationSuggestions = (fileName: string, filePath: string): Destination[] => {
    const fileType = getFileType(filePath)
    const suggestions: Destination[] = []

    // Add recent destinations
    recentDestinations.forEach((path) => {
      const name = path.split("/").filter(Boolean).pop() || path
      suggestions.push({
        path,
        name: `${name} (reciente)`,
        icon: <Clock size={16} className="text-blue-500" />,
        type: "recent",
      })
    })

    // Add favorite destinations
    favoriteDestinations.forEach((path) => {
      const name = path.split("/").filter(Boolean).pop() || path
      suggestions.push({
        path,
        name: `${name} (favorito)`,
        icon: <Star size={16} className="text-yellow-500" />,
        type: "favorite",
      })
    })

    // Add drives
    suggestions.push(
      {
        path: "C:/",
        name: "Disco C:",
        icon: <HardDrive size={16} className="mr-2 text-gray-800 dark:text-gray-200" />,
        type: "drive",
      },
      {
        path: "D:/",
        name: "Disco D:",
        icon: <HardDrive size={16} className="mr-2 text-gray-800 dark:text-gray-200" />,
        type: "drive",
      },
      {
        path: "E:/",
        name: "Disco E:",
        icon: <HardDrive size={16} className="mr-2 text-gray-800 dark:text-gray-200" />,
        type: "drive",
      },
      {
        path: "J:/",
        name: "Disco J:",
        icon: <HardDrive size={16} className="mr-2 text-gray-800 dark:text-gray-200" />,
        type: "drive",
      },
    )

    // Add common folders
    suggestions.push(
      {
        path: "C:/Proyectos/",
        name: "Proyectos",
        icon: <Folder size={16} className="mr-2 text-blue-500 dark:text-blue-400" />,
        type: "folder",
      },
      {
        path: "E:/antiguo unreal/",
        name: "Antiguo Unreal",
        icon: <Folder size={16} className="mr-2 text-blue-500 dark:text-blue-400" />,
        type: "folder",
      },
      {
        path: "J:/proyectos/",
        name: "Proyectos (J:)",
        icon: <Folder size={16} className="mr-2 text-blue-500 dark:text-blue-400" />,
        type: "folder",
      },
    )

    // Add parent folder if not at root
    if (currentPath !== "C:/" && currentPath !== "D:/" && currentPath !== "E:/" && currentPath !== "J:/") {
      const pathParts = currentPath.split("/").filter(Boolean)
      pathParts.pop() // Remove last part
      const parentPath = pathParts.length > 0 ? `${pathParts.join("/")}/` : `${pathParts[0]}:/`
      suggestions.push({
        path: parentPath,
        name: "Carpeta superior",
        icon: <FolderOpen size={16} className="text-blue-500" />,
        type: "special",
      })
    }

    // Add intelligent suggestions based on file type
    if (fileType === "unreal") {
      suggestions.push(
        {
          path: "E:/antiguo unreal/",
          name: "Antiguo Unreal",
          icon: <Folder size={16} className="mr-2 text-blue-500 dark:text-blue-400" />,
          type: "folder",
          isRecommended: true,
          description: "Carpeta para proyectos Unreal antiguos",
        },
        {
          path: "J:/proyectos/unreal/",
          name: "Proyectos Unreal",
          icon: <Folder size={16} className="mr-2 text-blue-500 dark:text-blue-400" />,
          type: "folder",
          isRecommended: true,
          description: "Carpeta para proyectos Unreal actuales",
        },
      )
    }

    // Add home directory
    suggestions.push({
      path: "C:/Users/User/",
      name: "Carpeta personal",
      icon: <Home size={16} className="text-purple-500" />,
      type: "special",
    })

    return suggestions
  }

  // Handle item selection with multi-select support
  const handleItemSelect = (e: React.MouseEvent, filePath: string) => {
    e.preventDefault()

    // Si el elemento ya está seleccionado mediante checkbox, no modificar su estado
    if (selectedItems.includes(filePath)) {
      // Solo establecer como último elemento seleccionado
      setLastSelectedItem(filePath)
      return
    }

    // If we're in analyzer mode with drive checkboxes and this is a drive path or quick access path
    const isDrivePath = /^[A-Z]:\/$/i.test(filePath)
    const isQuickAccessPath = quickAccessItems.some((item) => item.path === filePath)

    if (showDriveCheckboxes && (isDrivePath || isQuickAccessPath)) {
      // For drives and quick access items in analyzer mode, only select when checkbox is clicked
      // The checkbox has its own click handler
      setLastSelectedItem(filePath)
      return
    }

    // Rest of the existing function remains the same
    if (e.ctrlKey) {
      // Ctrl+click: Toggle selection of the clicked item
      setSelectedItems((prev) =>
        prev.includes(filePath) ? prev.filter((path) => path !== filePath) : [...prev, filePath],
      )
      setLastSelectedItem(filePath)
    } else if (e.shiftKey && lastSelectedItem) {
      // Shift+click: Select range from last selected to current
      const fileIndex = currentFiles.findIndex((file) => file.path === filePath)
      const lastIndex = currentFiles.findIndex((file) => file.path === lastSelectedItem)

      if (fileIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(fileIndex, lastIndex)
        const end = Math.max(fileIndex, lastIndex)

        const rangeSelection = currentFiles.slice(start, end + 1).map((file) => file.path)
        // Merge with existing selections instead of replacing
        const existingSelections = selectedItems.filter((path) => !currentFiles.some((file) => file.path === path))
        setSelectedItems([...existingSelections, ...rangeSelection])
      }
    } else {
      // Regular click: Select only this item, but preserve checkbox selections
      const checkboxSelections = selectedItems.filter((path) => {
        // Verificar si es una ruta de disco (C:/, D:/, etc.)
        const isDrivePath = /^[A-Z]:\/$/i.test(path)
        // Verificar si es una carpeta dentro de un disco
        const isFolderPath = /^[A-Z]:\/[^/]+\/$/.test(path)
        // Verificar si es una ruta de acceso rápido
        const isQuickAccessPath = quickAccessItems.some((item) => item.path === path)
        // Mantener seleccionados los discos, carpetas y accesos rápidos
        return isDrivePath || isFolderPath || isQuickAccessPath
      })

      // Añadir el elemento actual a la selección
      if (!checkboxSelections.includes(filePath)) {
        setSelectedItems([...checkboxSelections, filePath])
      } else {
        setSelectedItems(checkboxSelections)
      }

      setLastSelectedItem(filePath)
    }
  }

  // Start rubber band selection
  const handleMouseDown = (e: React.MouseEvent) => {
    // Solo iniciar rubber band en clic izquierdo en espacio vacío
    if (e.button !== 0) return

    // Prevent text selection during drag operations
    e.preventDefault()

    // Verificar si el clic fue en un espacio vacío y no en un elemento de archivo
    if (e.target !== fileListRef.current) return

    // Get mouse position relative to the container
    const rect = fileListRef.current!.getBoundingClientRect()
    const startX = e.clientX - rect.left
    const startY = e.clientY - rect.top

    setRubberBandStart({ x: startX, y: startY })
    setRubberBandEnd({ x: startX, y: startY })
    setIsRubberBanding(true)

    // Clear selection if not holding Ctrl
    if (!e.ctrlKey) {
      setSelectedItems([])
      setLastSelectedItem(null)
    }
  }

  // Update rubber band during mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isRubberBanding || !fileListRef.current) return

    // Evitar actualizaciones innecesarias verificando si la posición realmente cambió
    const rect = fileListRef.current.getBoundingClientRect()
    const endX = e.clientX - rect.left
    const endY = e.clientY - rect.top

    // Solo actualizar si la posición cambió significativamente (más de 1px)
    if (Math.abs(endX - rubberBandEnd.x) > 1 || Math.abs(endY - rubberBandEnd.y) > 1) {
      setRubberBandEnd({ x: endX, y: endY })
      // Mover la actualización de selección fuera del ciclo de renderizado
      requestAnimationFrame(() => {
        if (isRubberBanding) {
          updateSelectionFromRubberBand()
        }
      })
    }
  }

  // End rubber band selection
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isRubberBanding) return

    setIsRubberBanding(false)

    // Re-enable text selection
    document.body.style.userSelect = ""
    document.body.style.webkitUserSelect = "" // Corrected casing

    // If the rubber band is very small, it might be a click
    const width = Math.abs(rubberBandEnd.x - rubberBandStart.x)
    const height = Math.abs(rubberBandEnd.y - rubberBandStart.y)

    if (width < 5 && height < 5) {
      // It was just a click, clear selection
      if (!e.ctrlKey && !e.shiftKey) {
        setSelectedItems([])
        setLastSelectedItem(null)
      }
    }

    // Show selection actions if items are selected
    if (selectedItems.length > 0) {
      setShowSelectionActions(true)
      setSelectionActionPosition({
        x: e.clientX,
        y: e.clientY,
      })
    }
  }

  // Update selection based on rubber band position
  const updateSelectionFromRubberBand = () => {
    if (!fileListRef.current || !isRubberBanding) return

    // Calculate selection rectangle
    const left = Math.min(rubberBandStart.x, rubberBandEnd.x)
    const top = Math.min(rubberBandStart.y, rubberBandEnd.y)
    const right = Math.max(rubberBandStart.x, rubberBandEnd.x)
    const bottom = Math.max(rubberBandStart.y, rubberBandEnd.y)

    // Get all file elements
    const fileElements = fileListRef.current.querySelectorAll("[data-file-path]")

    // Check which elements intersect with the selection rectangle
    const newSelection: string[] = []

    fileElements.forEach((element) => {
      const rect = element.getBoundingClientRect()
      const fileRect = {
        left: rect.left - fileListRef.current!.getBoundingClientRect().left,
        top: rect.top - fileListRef.current!.getBoundingClientRect().top,
        right: rect.right - fileListRef.current!.getBoundingClientRect().left,
        bottom: rect.bottom - fileListRef.current!.getBoundingClientRect().top,
      }

      // Check if the element intersects with the selection rectangle
      if (fileRect.right >= left && fileRect.left <= right && fileRect.bottom >= top && fileRect.top <= bottom) {
        const filePath = element.getAttribute("data-file-path")
        if (filePath) {
          newSelection.push(filePath)
        }
      }
    })

    // Solo actualizar si la selección realmente cambió
    if (JSON.stringify(newSelection) !== JSON.stringify(selectedItems)) {
      setSelectedItems(newSelection)
    }
  }

  // Handle batch operations on selected items
  const handleBatchOperation = (operation: "move" | "copy" | "delete" | "rename") => {
    if (selectedItems.length === 0) return

    switch (operation) {
      case "move":
        // Show destination selector
        const suggestions = generateDestinationSuggestions("", selectedItems[0])
        setDestinations(suggestions)
        setShowDestinationPreview(true)
        break

      case "copy":
        // Show destination selector with copy operation
        const copyDestinations = generateDestinationSuggestions("", selectedItems[0])
        setDestinations(copyDestinations)
        setDropOperation("copy")
        setShowDestinationPreview(true)
        break

      case "delete":
        // Show delete confirmation
        setFileOperationDialog({
          visible: true,
          type: "confirm",
          title: "Delete Confirmation",
          message: `Are you sure you want to delete ${selectedItems.length} item(s)?`,
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          danger: true,
          onConfirm: () => {
            // Remove selected items from current files
            setCurrentFiles((prev) => prev.filter((file) => !selectedItems.includes(file.path)))
            showNotification(`${selectedItems.length} items deleted`, "success")
            setSelectedItems([])
            setFileOperationDialog((prev) => ({ ...prev, visible: false }))
          },
        })
        break

      case "rename":
        // For batch rename, we'd need a more complex UI
        // For now, only allow renaming if a single item is selected
        if (selectedItems.length === 1) {
          const fileName = selectedItems[0].split("/").pop() || ""
          setFileOperationDialog({
            visible: true,
            type: "input",
            title: "Rename",
            inputLabel: "New name:",
            inputValue: fileName,
            confirmLabel: "Rename",
            onConfirm: (newName) => {
              if (newName && newName !== fileName) {
                // Simulate renaming
                const parentPath = selectedItems[0].substring(0, selectedItems[0].lastIndexOf("/") + 1)
                const newPath = parentPath + newName

                // Update file in current files
                setCurrentFiles((prev) =>
                  prev.map((file) => {
                    if (file.path === selectedItems[0]) {
                      return { ...file, name: newName, path: newPath }
                    }
                    return file
                  }),
                )

                showNotification(`Renamed to ${newName}`, "success")
                setSelectedItems([])
              }
              setFileOperationDialog((prev) => ({ ...prev, visible: false }))
            },
          })
        } else {
          alert("Select only one item to rename")
        }
        break
    }

    // Hide selection actions
    setShowSelectionActions(false)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if a dialog is open
      if (fileOperationDialog.visible || propertiesDialog.visible) return

      // Handle keyboard shortcuts
      if (e.key === "Delete" && selectedItems.length > 0) {
        e.preventDefault()
        handleBatchOperation("delete")
      } else if (e.key === "F2" && selectedItems.length === 1) {
        e.preventDefault()
        handleBatchOperation("rename")
      } else if (e.ctrlKey && e.key === "c" && selectedItems.length > 0) {
        e.preventDefault()
        // Copy to clipboard
        setClipboard({
          action: "copy",
          item: {
            name: selectedItems[0].split("/").pop() || "",
            path: selectedItems[0],
            type: getFileType(selectedItems[0]),
            isDirectory: getFileType(selectedItems[0]) === "folder",
            id: Math.random().toString(36).substring(2, 15),
          },
        })
        showNotification(`${selectedItems.length} item(s) copied to clipboard`, "success")
      } else if (e.ctrlKey && e.key === "x" && selectedItems.length > 0) {
        e.preventDefault()
        // Cut to clipboard
        setClipboard({
          action: "cut",
          item: {
            name: selectedItems[0].split("/").pop() || "",
            path: selectedItems[0],
            type: getFileType(selectedItems[0]),
            isDirectory: getFileType(selectedItems[0]) === "folder",
            id: Math.random().toString(36).substring(2, 15),
          },
        })
        showNotification(`${selectedItems.length} item(s) cut to clipboard`, "success")
      } else if (e.ctrlKey && e.key === "v" && clipboard && clipboard.item) {
        e.preventDefault()
        // Paste from clipboard
        handleContextMenuAction("paste", currentPath)
      } else if (e.ctrlKey && e.key === "a") {
        e.preventDefault()
        // Select all
        setSelectedItems(currentFiles.map((file) => file.path))
      } else if (e.key === "Escape") {
        e.preventDefault()
        // Clear selection
        setSelectedItems([])
        setLastSelectedItem(null)
        setShowSelectionActions(false)
        setContextMenu((prev) => ({ ...prev, visible: false }))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedItems, currentFiles, clipboard, fileOperationDialog.visible, propertiesDialog.visible, currentPath])

  const handleMoveTo = (item: FileItem, destination: string) => {
    // Implementation for moving to destination
    console.log(`Moving ${item.name} to ${destination}`)
  }

  const handleCopyTo = (item: FileItem, destination: string) => {
    // Implementation for copying to destination
    console.log(`Copying ${item.name} to ${destination}`)
  }

  const handleShowProperties = (item: FileItem) => {
    // Implementation for showing properties
    console.log(`Showing properties for ${item.name}`)
  }

  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleItemClick = (item: FileItem) => {
    setSelectedItem(item.id)
  }

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === "folder" || item.type === "drive") {
      toggleFolder(item.id)
    }
  }

  const renderItem = (item: FileItem, depth: number) => {
    const isExpanded = expandedFolders.includes(item.id)
    const hasChildren = item.children && item.children.length > 0
    const paddingLeft = depth * 16 + 8

    return (
      <div
        key={item.id}
        className={`flex items-center px-2 py-1 cursor-pointer hover:bg-blue-100 ${
          selectedItem === item.id ? "bg-blue-200" : ""
        }`}
        style={{ paddingLeft }}
        onClick={() => handleItemClick(item)}
        onDoubleClick={() => handleItemDoubleClick(item)}
      >
        {(item.type === "folder" || item.type === "drive") && (
          <div
            className="mr-1 w-4 h-4 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              toggleFolder(item.id)
            }}
          >
            {hasChildren && <ExpandIcon expanded={isExpanded} onClick={() => {}} />}
          </div>
        )}

        {item.type === "drive" && <HardDrive className="mr-2 h-4 w-4 text-gray-800 dark:text-gray-200" />}

        {item.type === "folder" && <Folder className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />}

        {item.type === "file" && <FileText className="mr-2 h-4 w-4 text-gray-500" />}

        <span className="truncate">{item.name}</span>

        {item.favorite && <Star className="ml-2 h-3 w-3 text-yellow-500 fill-yellow-500" />}
      </div>
    )
  }

  const renderFileTree = (item: FileItem, depth: number) => {
    const isExpanded = expandedFolders.includes(item.id)

    return (
      <div key={item.id}>
        {renderItem(item, depth)}
        {isExpanded && item.children && (
          <div className="ml-4">{item.children.map((child) => renderFileTree(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  const data: FileItem[] = [
    {
      id: "root",
      name: "This PC",
      type: "drive",
      path: "/",
      isDirectory: true,
      children: [
        {
          id: "documents",
          name: "Documents",
          type: "folder",
          path: "/C:/Users/User/Documents",
          isDirectory: true,
        },
        {
          id: "downloads",
          name: "Downloads",
          type: "folder",
          path: "/C:/Users/User/Downloads",
          isDirectory: true,
        },
        {
          id: "desktop",
          name: "Desktop",
          type: "folder",
          path: "/C:/Users/User/Desktop",
          isDirectory: true,
        },
        {
          id: "pictures",
          name: "Pictures",
          type: "folder",
          path: "/C:/Users/User/Pictures",
          isDirectory: true,
        },
        {
          id: "music",
          name: "Music",
          type: "folder",
          path: "/C:/Users/User/Music",
          isDirectory: true,
        },
        {
          id: "videos",
          name: "Videos",
          type: "folder",
          path: "/C:/Users/User/Videos",
          isDirectory: true,
        },
      ],
    },
  ]

  const scrollbarStyles = `
    /* Webkit Scrollbar Styles */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `;

  useEffect(() => {
    // Add custom scrollbar styles to the document
    const styleElement = document.createElement("style")
    styleElement.textContent = scrollbarStyles
    document.head.appendChild(styleElement)

    // Clean up on unmount
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Manejadores de eventos para el redimensionamiento
  useEffect(() => {
    // Calcular los límites de redimensionamiento (50% en ambas direcciones)
    const originalWidth = compact ? 200 : 260
    setInitialNavWidth(originalWidth)
    setMinNavWidth(originalWidth * 0.5) // 50% más pequeño
    setMaxNavWidth(originalWidth * 1.5) // 50% más grande
    setNavWidth(originalWidth) // Asegurar que el ancho inicial sea correcto
  }, [compact])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      // Calcular el cambio en la posición X del ratón
      const deltaX = e.clientX - initialMouseX

      // Calcular el nuevo ancho basado en el ancho inicial y el cambio en X
      let newWidth = initialNavWidth + deltaX

      // Aplicar restricciones (no menor que minNavWidth, no mayor que maxNavWidth)
      newWidth = Math.max(minNavWidth, Math.min(maxNavWidth, newWidth))

      // Actualizar el ancho de la navegación
      setNavWidth(newWidth)

      // Actualizar el indicador de tamaño
      setSizeIndicatorPosition({ x: e.clientX + 10, y: e.clientY })
      setCurrentSize(Math.round(newWidth))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setShowSizeIndicator(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, initialMouseX, initialNavWidth, minNavWidth, maxNavWidth])

  // Render the breadcrumb context menu
  const renderBreadcrumbContextMenu = () => {
    if (!showBreadcrumbMenu) return null

    return (
      <div
        className="fixed bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-md z-50"
        style={{
          left: breadcrumbMenuPosition.x,
          top: breadcrumbMenuPosition.y,
        }}
      >
        <div className="py-1">
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none"
            onClick={() => handleBreadcrumbMenuAction("copy")}
          >
            Copy Address
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none"
            onClick={() => handleBreadcrumbMenuAction("paste-go")}
          >
            Paste and Go
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none"
            onClick={() => handleBreadcrumbMenuAction("paste")}
          >
            Paste
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none"
            onClick={() => handleBreadcrumbMenuAction("edit")}
          >
            Edit Address
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Barra de navegación */}
      <aside
        ref={navRef}
        style={{ width: `${navWidth}px` }}
        className={`bg-gray-50 dark:bg-gray-900 border-r dark:border-gray-700 transition-colors ${
          isResizing ? "border-r-2 border-blue-400 dark:border-blue-600" : ""
        } overflow-x-hidden custom-scrollbar group relative`}
      >
        <div className="p-2">
          {/* Barra de búsqueda */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar"
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Acceso rápido */}
          <div className="mt-4">
            <div
              className="flex items-center justify-between p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer"
              onClick={() => setExpandedSections((prev) => ({ ...prev, quickAccess: !prev.quickAccess }))}
            >
              <div className="flex items-center">
                <Star size={16} className="mr-2 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Acceso rápido</span>
              </div>
              <ExpandIcon
                expanded={expandedSections.quickAccess}
                onClick={(e) => {
                  e.stopPropagation() // Prevent collapse when clicking the icon
                  setExpandedSections((prev) => ({ ...prev, quickAccess: !prev.quickAccess }))
                }}
              />
            </div>
            {expandedSections.quickAccess && (
              <ul className="ml-2">
                {quickAccessItems.map((item) => (
                  <li
                    key={item.path}
                    className={`flex items-center p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer ${
                      currentPath === item.path ? "bg-blue-200 dark:bg-blue-700" : ""
                    }`}
                    onClick={() => changePath(item.path)}
                    onContextMenu={(e) => handleShowContextMenu(e, "folder", item.path, item.name)}
                  >
                    {showDriveCheckboxes && (
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedItems.includes(item.path)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems((prev) => [...prev, item.path])
                          } else {
                            setSelectedItems((prev) => prev.filter((path) => path !== item.path))
                          }
                          e.stopPropagation()
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    {item.icon}
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Este equipo */}
          <div className="mt-2">
            <div
              className="flex items-center justify-between p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer"
              onClick={() => setExpandedSections((prev) => ({ ...prev, thisPC: !prev.thisPC }))}
            >
              <div className="flex items-center">
                <Computer size={16} className="mr-2 text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Este equipo</span>
              </div>
              <ExpandIcon
                expanded={expandedSections.thisPC}
                onClick={(e) => {
                  e.stopPropagation() // Prevent collapse when clicking the icon
                  setExpandedSections((prev) => ({ ...prev, thisPC: !prev.thisPC }))
                }}
              />
            </div>
            {expandedSections.thisPC && (
              <ul className="ml-2">
                {/* Drive C: */}
                <li className="flex items-center justify-between p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer">
                  <div className="flex items-center">
                    {showDriveCheckboxes && (
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedItems.includes("C:/")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems((prev) => [...prev, "C:/"])
                          } else {
                            setSelectedItems((prev) => prev.filter((item) => item !== "C:/"))
                          }
                        }}
                      />
                    )}
                    <HardDrive size={16} className="mr-2 text-gray-800 dark:text-gray-200" />
                    <span
                      className={`text-sm text-gray-700 dark:text-gray-300 ${
                        currentPath === "C:/" ? "font-medium" : ""
                      }`}
                      onClick={() => changePath("C:/")}
                    >
                      Disco C:
                    </span>
                  </div>
                  <ExpandIcon
                    expanded={expandedSections.driveC}
                    onClick={(e) => {
                      e.stopPropagation() // Prevent collapse when clicking the icon
                      setExpandedSections((prev) => ({ ...prev, driveC: !prev.driveC }))
                    }}
                  />
                </li>
                {expandedSections.driveC && (
                  <ul className="ml-4">
                    <li
                      className={`flex items-center p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer ${
                        currentPath === "C:/Proyectos/" ? "bg-blue-200 dark:bg-blue-700" : ""
                      }`}
                      onClick={() => changePath("C:/Proyectos/")}
                      onContextMenu={(e) => handleShowContextMenu(e, "folder", "C:/Proyectos/", "Proyectos")}
                    >
                      <Folder size={16} className="mr-2 text-blue-500 dark:text-blue-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Proyectos</span>
                    </li>
                  </ul>
                )}

                {/* Drive D: */}
                <li className="flex items-center justify-between p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer">
                  <div className="flex items-center">
                    {showDriveCheckboxes && (
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedItems.includes("D:/")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems((prev) => [...prev, "D:/"])
                          } else {
                            setSelectedItems((prev) => prev.filter((item) => item !== "D:/"))
                          }
                        }}
                      />
                    )}
                    <HardDrive size={16} className="mr-2 text-gray-800 dark:text-gray-200" />
                    <span
                      className={`text-sm text-gray-700 dark:text-gray-300 ${
                        currentPath === "D:/" ? "font-medium" : ""
                      }`}
                      onClick={() => changePath("D:/")}
                    >
                      Disco D:
                    </span>
                  </div>
                  <ExpandIcon
                    expanded={expandedSections.driveD}
                    onClick={(e) => {
                      e.stopPropagation() // Prevent collapse when clicking the icon
                      setExpandedSections((prev) => ({ ...prev, driveD: !prev.driveD }))
                    }}
                  />
                </li>
                {expandedSections.driveD && (
                  <ul className="ml-4">
                    <li
                      className={`flex items-center p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer ${
                        currentPath === "D:/Unreal Projects/" ? "bg-blue-200 dark:bg-blue-700" : ""
                      }`}
                      onClick={() => changePath("D:/Unreal Projects/")}
                      onContextMenu={(e) =>
                        handleShowContextMenu(e, "folder", "D:/Unreal Projects/", "Unreal Projects")
                      }
                    >
                      <Folder size={16} className="mr-2 text-blue-500 dark:text-blue-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Unreal Projects</span>
                    </li>
                  </ul>
                )}

                {/* Drive E: */}
                <li className="flex items-center justify-between p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer">
                  <div className="flex items-center">
                    {showDriveCheckboxes && (
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedItems.includes("E:/")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems((prev) => [...prev, "E:/"])
                          } else {
                            setSelectedItems((prev) => prev.filter((item) => item !== "E:/"))
                          }
                        }}
                      />
                    )}
                    <HardDrive size={16} className="mr-2 text-gray-800 dark:text-gray-200" />
                    <span
                      className={`text-sm text-gray-700 dark:text-gray-300 ${
                        currentPath === "E:/" ? "font-medium" : ""
                      }`}
                      onClick={() => changePath("E:/")}
                    >
                      Disco E:
                    </span>
                  </div>
                  <ExpandIcon
                    expanded={expandedSections.driveE}
                    onClick={(e) => {
                      e.stopPropagation() // Prevent collapse when clicking the icon
                      setExpandedSections((prev) => ({ ...prev, driveE: !prev.driveE }))
                    }}
                  />
                </li>

                {/* Drive J: */}
                <li className="flex items-center justify-between p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer">
                  <div className="flex items-center">
                    {showDriveCheckboxes && (
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedItems.includes("J:/")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems((prev) => [...prev, "J:/"])
                          } else {
                            setSelectedItems((prev) => prev.filter((item) => item !== "J:/"))
                          }
                        }}
                      />
                    )}
                    <HardDrive size={16} className="mr-2 text-gray-800 dark:text-gray-200" />
                    <span
                      className={`text-sm text-gray-700 dark:text-gray-300 ${
                        currentPath === "J:/" ? "font-medium" : ""
                      }`}
                      onClick={() => changePath("J:/")}
                    >
                      Disco J:
                    </span>
                  </div>
                  <ExpandIcon
                    expanded={expandedSections.driveJ}
                    onClick={(e) => {
                      e.stopPropagation() // Prevent collapse when clicking the icon
                      setExpandedSections((prev) => ({ ...prev, driveJ: !prev.driveJ }))
                    }}
                  />
                </li>
                {expandedSections.driveJ && (
                  <ul className="ml-4">
                    <li
                      className={`flex items-center p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer ${
                        currentPath === "J:/proyectos/" ? "bg-blue-200 dark:bg-blue-700" : ""
                      }`}
                      onClick={() => changePath("J:/proyectos/")}
                      onContextMenu={(e) => handleShowContextMenu(e, "folder", "J:/proyectos/", "proyectos")}
                    >
                      <Folder size={16} className="mr-2 text-blue-500 dark:text-blue-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">proyectos</span>
                    </li>
                  </ul>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Resizer */}
        {!compact && (
          <div
            ref={resizeRef}
            className={`absolute top-0 right-0 h-full w-2 hover:bg-blue-300 dark:hover:bg-blue-700 cursor-col-resize flex items-center justify-center transition-colors ${
              isResizing ? "bg-blue-400 dark:bg-blue-600" : "bg-gray-200 dark:bg-gray-800"
            }`}
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizing(true)
              setInitialMouseX(e.clientX)
              setInitialNavWidth(navWidth)
              setShowSizeIndicator(true)
              setSizeIndicatorPosition({ x: e.clientX + 10, y: e.clientY })
              setCurrentSize(navWidth)
            }}
          >
            <div
              className={`h-16 w-1 rounded-full transition-opacity ${
                isResizing
                  ? "bg-blue-500 dark:bg-blue-400 opacity-100"
                  : "bg-gray-400 dark:bg-gray-600 opacity-0 group-hover:opacity-100"
              }`}
            ></div>
          </div>
        )}
      </aside>

      {/* Contenido principal */}
      <main ref={mainContentRef} className="flex-1 bg-white dark:bg-gray-800 overflow-hidden">
        {/* Encabezado */}
        <header className="bg-gray-100 dark:bg-gray-900 border-b dark:border-gray-700 p-2 flex items-center justify-between">
          {/* Navegación */}
          <div className="flex items-center">
            <button
              className="p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800"
              onClick={() => {
                const pathParts = currentPath.split("/").filter(Boolean)
                if (pathParts.length > 1) {
                  pathParts.pop()
                  const newPath = pathParts.join("/") + "/"
                  changePath(newPath)
                } else if (
                  pathParts.length === 1 &&
                  currentPath !== "C:/" &&
                  currentPath !== "D:/" &&
                  currentPath !== "E:/" &&
                  currentPath !== "J:/"
                ) {
                  changePath("C:/")
                }
              }}
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              className="p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800"
              onClick={() => loadFilesForPath(currentPath)}
            >
              <RefreshCw size={20} className="text-gray-600 dark:text-gray-400" />
            </button>

            {/* Breadcrumb Navigation */}
            <div
              ref={breadcrumbContainerRef}
              className="flex items-center ml-2 text-sm relative"
              onContextMenu={handleBreadcrumbContextMenu}
            >
              {isEditingPath ? (
                <div className="relative w-full">
                  <input
                    ref={breadcrumbInputRef}
                    type="text"
                    value={editPathValue}
                    onChange={(e) => setEditPathValue(e.target.value)}
                    onKeyDown={handlePathInputKeyDown}
                    className={`w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      pathError ? "border-red-500" : "border-gray-300"
                    }`}
                    autoFocus
                  />
                  {pathError && (
                    <div className="absolute left-0 -bottom-6 text-xs text-red-500 bg-white p-1 rounded shadow-sm border border-red-200 z-10">
                      {pathError}
                    </div>
                  )}
                </div>
              ) : (
                currentPath
                  .split("/")
                  .filter(Boolean)
                  .reduce(
                    (acc: React.ReactNode[], part, index, array) => {
                      // Build the path up to this segment
                      const pathToHere = array.slice(0, index + 1).join("/") + "/"

                      // For drive letters (like C:), add the slash
                      const displayPart = part.endsWith(":") ? `${part}/` : part

                      // Add the segment and separator
                      acc.push(
                        <button
                          key={pathToHere}
                          onClick={() => changePath(pathToHere)}
                          className="font-medium text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 hover:underline"
                          title={pathToHere}
                        >
                          {displayPart}
                        </button>,
                      )

                      // Add separator if not the last item
                      if (index < array.length - 1) {
                        acc.push(
                          <span key={`sep-${index}`} className="mx-1 text-gray-500 dark:text-gray-400">
                            /
                          </span>,
                        )
                      } else {
                        // Add trailing slash for the last item
                        acc.push(
                          <span key="last-slash" className="text-gray-500 dark:text-gray-400">
                            /
                          </span>,
                        )
                      }

                      return acc
                    },
                    [
                      // Start with root or drive letter
                      currentPath.startsWith("/") ? (
                        <button
                          key="root"
                          onClick={() => changePath("/")}
                          className="font-medium text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 hover:underline"
                        >
                          /
                        </button>
                      ) : (
                        // Empty element for drive paths
                        <React.Fragment key="empty-start"></React.Fragment>
                      ),
                    ],
                  )
              )}
            </div>
          </div>

          {/* Opciones de vista */}
          {viewModeOptions && (
            <div className="flex items-center">
              <button
                className={`p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 ${
                  viewMode === "list" ? "bg-blue-200 dark:bg-blue-700" : ""
                }`}
                onClick={() => setViewMode("list")}
              >
                <List size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button
                className={`p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 ${
                  viewMode === "icons" ? "bg-blue-200 dark:bg-blue-700" : ""
                }`}
                onClick={() => setViewMode("icons")}
              >
                <Grid size={20} className="text-gray-600 dark:text-gray-400" />
              </button>

              {/* Icon Size Menu */}
              <div className="relative">
                <button
                  className="p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800"
                  onClick={() => setShowIconSizeMenu(!showIconSizeMenu)}
                >
                  <ImageIcon size={20} className="text-gray-600 dark:text-gray-400" />
                </button>

                {showIconSizeMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-md z-10">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none"
                      onClick={() => {
                        setIconSize("small")
                        setShowIconSizeMenu(false)
                        setIconSizeNotificationText("Iconos pequeños")
                        setShowIconSizeNotification(true)
                        setTimeout(() => setShowIconSizeNotification(false), 2000)
                      }}
                    >
                      Pequeño
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none"
                      onClick={() => {
                        setIconSize("medium")
                        setShowIconSizeMenu(false)
                        setIconSizeNotificationText("Iconos medianos")
                        setShowIconSizeNotification(true)
                        setTimeout(() => setShowIconSizeNotification(false), 2000)
                      }}
                    >
                      Mediano
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none"
                      onClick={() => {
                        setIconSize("large")
                        setShowIconSizeMenu(false)
                        setIconSizeNotificationText("Iconos grandes")
                        setShowIconSizeNotification(true)
                        setTimeout(() => setShowIconSizeNotification(false), 2000)
                      }}
                    >
                      Grande
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Contenido del explorador */}
        <div
          ref={fileListRef}
          className="p-4 relative overflow-auto h-[calc(100%-60px)] custom-scrollbar"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleEmptyAreaContextMenu}
          style={{ userSelect: isRubberBanding ? "none" : "auto" }}
        >
          {/* Overlay para el rubber banding */}
          {isRubberBanding && (
            <div
              className="absolute bg-blue-500 opacity-20 border border-blue-500"
              style={{
                left: Math.min(rubberBandStart.x, rubberBandEnd.x),
                top: Math.min(rubberBandStart.y, rubberBandEnd.y),
                width: Math.abs(rubberBandEnd.x - rubberBandStart.x),
                height: Math.abs(rubberBandEnd.y - rubberBandStart.y),
                pointerEvents: "none",
              }}
            />
          )}

          {/* Lista de archivos */}
          {viewMode === "list" ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-400">
                  <th className="font-normal py-2">Nombre</th>
                  <th className="font-normal py-2">Tipo</th>
                  <th className="font-normal py-2">Tamaño</th>
                  <th className="font-normal py-2">Modificado</th>
                </tr>
              </thead>
              <tbody>
                {currentFiles.map((file) => (
                  <tr
                    key={file.path}
                    data-file-path={file.path}
                    className={`hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer ${
                      selectedItems.includes(file.path) ? "bg-blue-200 dark:bg-blue-700" : ""
                    }`}
                    onClick={(e) => handleItemSelect(e, file.path)}
                    onContextMenu={(e) => handleShowContextMenu(e, "file", file.path, file.name)}
                  >
                    <td className="py-2">
                      <div className="flex items-center">
                        {file.isDirectory ? (
                          <Folder size={16} className="mr-2 text-blue-500 dark:text-blue-400" />
                        ) : (
                          <FileText size={16} className="mr-2 text-gray-500" />
                        )}
                        {file.name}
                      </div>
                    </td>
                    <td className="py-2 text-gray-500">{file.type}</td>
                    <td className="py-2 text-gray-500">{formatSize(file.size)}</td>
                    <td className="py-2 text-gray-500">{file.modified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {currentFiles.map((file) => (
                <div
                  key={file.path}
                  data-file-path={file.path}
                  className={`flex flex-col items-center p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer ${
                    selectedItems.includes(file.path) ? "bg-blue-200 dark:bg-blue-700" : ""
                  }`}
                  onClick={(e) => handleItemSelect(e, file.path)}
                  onContextMenu={(e) => handleShowContextMenu(e, "file", file.path, file.name)}
                >
                  {file.isDirectory ? (
                    <Folder
                      size={iconSize === "small" ? 32 : iconSize === "medium" ? 48 : 64}
                      className="text-blue-500 dark:text-blue-400"
                    />
                  ) : (
                    <FileText
                      size={iconSize === "small" ? 32 : iconSize === "medium" ? 48 : 64}
                      className="text-gray-500"
                    />
                  )}
                  <span className="mt-1 text-sm text-gray-700 dark:text-gray-300 text-center">{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Breadcrumb Context Menu */}
        {renderBreadcrumbContextMenu()}

        {/* Notificación */}
        {notification && (
          <div className={`fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-md shadow-lg z-50`}>
            {notification.message}
          </div>
        )}

        {/* Icon Size Change Notification */}
        {showIconSizeNotification && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white p-3 rounded-md shadow-lg z-50">
            {iconSizeNotificationText}
          </div>
        )}

        {/* Indicador de tamaño durante el redimensionamiento */}
        {showSizeIndicator && (
          <div
            className="fixed bg-blue-500 text-white px-2 py-1 rounded text-xs z-50 pointer-events-none"
            style={{
              left: sizeIndicatorPosition.x,
              top: sizeIndicatorPosition.y,
              transform: "translate(0, -50%)",
            }}
          >
            {currentSize}px
          </div>
        )}
      </main>
    </div>
  )
}
