import React from "react";
import React from "react";
import React from "react";
import React from "react";
"use client"

import React from "react"
import {
  FileText,
  Folder,
  Copy,
  Scissors,
  Trash2,
  Edit,
  ExternalLink,
  Info,
  Clock,
  Star,
  FolderPlus,
  FilePlus,
  Move,
  Download,
  ArrowRight,
} from "lucide-react"

interface ContextMenuProps {
  visible: boolean // Add this prop
  x: number
  y: number
  targetType: "file" | "folder" | "drive" | "empty" | null
  targetName: string | null
  targetPath: string | null
  onClose: () => void
  onAction: (action: string, targetPath: string | null) => void
  recentDestinations?: string[]
  favoriteDestinations?: string[]
  clipboard?: { items: string[]; operation: "copy" | "cut" | null } | null
}

export function ContextMenu({
  visible,
  x,
  y,
  targetType,
  targetName,
  targetPath,
  onClose,
  onAction,
  recentDestinations = [],
  favoriteDestinations = [],
  clipboard = { items: [], operation: null },
}: ContextMenuProps) {
  // Reference to the menu element
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Adjust position if menu would go off screen
  const [adjustedPosition, setAdjustedPosition] = React.useState({ x, y })

  // Close the menu when clicking outside
  React.useEffect(() => {
    if (!visible) return

    const handleClickOutside = (event: MouseEvent) => {
      // Close the menu if clicking outside of it
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // Add event listener with capture to ensure it fires before other handlers
    document.addEventListener("mousedown", handleClickOutside, true)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true)
    }
  }, [visible, onClose])

  React.useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let newX = x
      let newY = y

      // Check right edge
      if (x + rect.width > viewportWidth) {
        newX = Math.max(0, viewportWidth - rect.width)
      }

      // Check bottom edge
      if (y + rect.height > viewportHeight) {
        newY = Math.max(0, viewportHeight - rect.height)
      }

      // Check if menu would be too close to the left edge
      if (newX < 5) {
        newX = 5
      }

      // Check if menu would be too close to the top edge
      if (newY < 5) {
        newY = 5
      }

      setAdjustedPosition({ x: newX, y: newY })
    }
  }, [x, y, menuRef.current])

  // Get icon based on target type
  const getTargetIcon = () => {
    switch (targetType) {
      case "file":
        return <FileText className="w-5 h-5 text-blue-500" />
      case "folder":
        return <Folder className="w-5 h-5 text-yellow-500" />
      case "drive":
        return <Folder className="w-5 h-5 text-blue-500" />
      default:
        return null
    }
  }

  // Format path for display
  const formatPath = (path: string) => {
    if (!path) return ""
    const parts = path.split("/")
    if (parts.length <= 2) return path
    return `${parts[0]}/.../${parts[parts.length - 1]}`
  }

  // Get destination name from path
  const getDestinationName = (path: string) => {
    const parts = path.split("/").filter(Boolean)
    return parts[parts.length - 1] || path
  }

  if (!visible) {
    return null
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 w-64 overflow-hidden"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        transform: "translate(0, 0)",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      {/* Header with target info */}
      {targetName && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center">
            {getTargetIcon()}
            <span className="ml-2 font-medium text-sm truncate">{targetName}</span>
          </div>
          {targetPath && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{formatPath(targetPath)}</div>
          )}
        </div>
      )}

      {/* Primary actions */}
      <div className="p-1 border-b border-gray-200 dark:border-gray-700">
        {targetType === "file" && (
          <button
            className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
            onClick={() => onAction("open", targetPath)}
          >
            <ExternalLink className="w-4 h-4 mr-3 text-blue-500" />
            Open
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Enter</span>
          </button>
        )}

        {targetType === "folder" && (
          <button
            className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
            onClick={() => onAction("open", targetPath)}
          >
            <Folder className="w-4 h-4 mr-3 text-blue-500" />
            Open
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Enter</span>
          </button>
        )}

        {targetType === "file" && (
          <button
            className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
            onClick={() => onAction("openWith", targetPath)}
          >
            <ArrowRight className="w-4 h-4 mr-3 text-blue-500" />
            Open with...
          </button>
        )}

        <button
          className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
          onClick={() => onAction("copyPath", targetPath)}
        >
          <Copy className="w-4 h-4 mr-3 text-blue-500" />
          Copy path
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Ctrl+C</span>
        </button>

        {(targetType === "file" || targetType === "folder") && (
          <button
            className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
            onClick={() => onAction("rename", targetPath)}
          >
            <Edit className="w-4 h-4 mr-3 text-blue-500" />
            Rename
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">F2</span>
          </button>
        )}
      </div>

      {/* Move to section */}
      {(targetType === "file" || targetType === "folder") && (
        <div className="p-1 border-b border-gray-200 dark:border-gray-700">
          <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400">Move to</div>

          {recentDestinations.slice(0, 3).map((dest) => (
            <button
              key={dest}
              className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
              onClick={() => onAction("moveTo", dest)}
            >
              <Clock className="w-4 h-4 mr-3 text-blue-500" />
              {getDestinationName(dest)} (recent)
            </button>
          ))}

          {favoriteDestinations.slice(0, 2).map((dest) => (
            <button
              key={dest}
              className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
              onClick={() => onAction("moveTo", dest)}
            >
              <Star className="w-4 h-4 mr-3 text-yellow-500" />
              {getDestinationName(dest)} (favorite)
            </button>
          ))}

          <button
            className="flex items-center w-full text-left px-3 py-2 text-sm text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
            onClick={() => onAction("moreDestinations", null)}
          >
            More destinations...
          </button>
        </div>
      )}

      {/* File operations */}
      <div className="p-1 border-b border-gray-200 dark:border-gray-700">
        {(targetType === "file" || targetType === "folder") && (
          <>
            <button
              className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
              onClick={() => onAction("copyTo", targetPath)}
            >
              <Copy className="w-4 h-4 mr-3 text-blue-500" />
              Copy to...
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Ctrl+Shift+C</span>
            </button>
            <button
              className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
              onClick={() => onAction("moveTo", targetPath)}
            >
              <Move className="w-4 h-4 mr-3 text-blue-500" />
              Move to...
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Ctrl+Shift+X</span>
            </button>
          </>
        )}

        {targetType === "folder" && (
          <>
            <button
              className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
              onClick={() => onAction("newFile", targetPath)}
            >
              <FilePlus className="w-4 h-4 mr-3 text-blue-500" />
              New file
            </button>
            <button
              className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
              onClick={() => onAction("newFolder", targetPath)}
            >
              <FolderPlus className="w-4 h-4 mr-3 text-blue-500" />
              New folder
            </button>
          </>
        )}

        {targetType === "empty" && (
          <>
            <button
              className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
              onClick={() => onAction("newFile", targetPath)}
            >
              <FilePlus className="w-4 h-4 mr-3 text-blue-500" />
              New file
            </button>
            <button
              className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
              onClick={() => onAction("newFolder", targetPath)}
            >
              <FolderPlus className="w-4 h-4 mr-3 text-blue-500" />
              New folder
            </button>
            <button
              className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
              onClick={() => onAction("paste", targetPath)}
            >
              <Scissors className="w-4 h-4 mr-3 text-blue-500" />
              Paste
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Ctrl+V</span>
            </button>
          </>
        )}

        {targetType === "file" && (
          <button
            className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
            onClick={() => onAction("download", targetPath)}
          >
            <Download className="w-4 h-4 mr-3 text-blue-500" />
            Download
          </button>
        )}

        <button
          className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md"
          onClick={() => onAction("properties", targetPath)}
        >
          <Info className="w-4 h-4 mr-3 text-blue-500" />
          Properties
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Alt+Enter</span>
        </button>
      </div>

      {/* Delete action */}
      {(targetType === "file" || targetType === "folder") && (
        <div className="p-1">
          <button
            className="flex items-center w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-md"
            onClick={() => onAction("delete", targetPath)}
          >
            <Trash2 className="w-4 h-4 mr-3 text-red-500" />
            Delete
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}
