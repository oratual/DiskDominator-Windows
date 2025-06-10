"use client"

import type React from "react"
import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  HardDrive,
  File,
  Folder,
  Download,
  FileText,
  Monitor,
  ImageIcon,
  Music,
  Box,
  Video,
  Plus,
  Move,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Define the file system structure types
interface FileSystemItem {
  id: string
  name: string
  type: "file" | "folder" | "drive"
  size?: number
  children?: FileSystemItem[]
  path: string
}

interface FileExplorerProps {
  initialData: FileSystemItem[]
  onSelect?: (item: FileSystemItem) => void
  className?: string
}

// Quick access locations with their respective icons
const quickAccessItems: FileSystemItem[] = [
  {
    id: "downloads",
    name: "Downloads",
    type: "folder",
    path: "/downloads",
    children: [],
  },
  {
    id: "documents",
    name: "Documents",
    type: "folder",
    path: "/documents",
    children: [],
  },
  {
    id: "desktop",
    name: "Desktop",
    type: "folder",
    path: "/desktop",
    children: [],
  },
  {
    id: "pictures",
    name: "Pictures",
    type: "folder",
    path: "/pictures",
    children: [],
  },
  {
    id: "music",
    name: "Music",
    type: "folder",
    path: "/music",
    children: [],
  },
  {
    id: "3dobjects",
    name: "3D Objects",
    type: "folder",
    path: "/3dobjects",
    children: [],
  },
  {
    id: "videos",
    name: "Videos",
    type: "folder",
    path: "/videos",
    children: [],
  },
]

export function EnhancedFileExplorer({ initialData, onSelect, className }: FileExplorerProps) {
  const [data, setData] = useState<FileSystemItem[]>(initialData)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [showQuickAccess, setShowQuickAccess] = useState<boolean>(true)
  const [showFileActions, setShowFileActions] = useState<boolean>(false)
  const [actionTarget, setActionTarget] = useState<FileSystemItem | null>(null)
  const [newFileName, setNewFileName] = useState<string>("")
  const [moveTarget, setMoveTarget] = useState<FileSystemItem | null>(null)
  const [moveDestination, setMoveDestination] = useState<string | null>(null)

  // Toggle expanded state for an item
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Handle item selection
  const handleSelect = (item: FileSystemItem) => {
    setSelectedItem(item.id)
    if (onSelect) {
      onSelect(item)
    }
  }

  // Get icon for a file system item
  const getItemIcon = (item: FileSystemItem) => {
    if (item.type === "drive") {
      return <HardDrive className="h-4 w-4 text-black" />
    } else if (item.type === "folder") {
      // Special icons for quick access folders
      if (item.id === "downloads") {
        return <Download className="h-4 w-4 text-blue-500" />
      } else if (item.id === "documents") {
        return <FileText className="h-4 w-4 text-blue-500" />
      } else if (item.id === "desktop") {
        return <Monitor className="h-4 w-4 text-blue-500" />
      } else if (item.id === "pictures") {
        return <ImageIcon className="h-4 w-4 text-blue-500" />
      } else if (item.id === "music") {
        return <Music className="h-4 w-4 text-blue-500" />
      } else if (item.id === "3dobjects") {
        return <Box className="h-4 w-4 text-blue-500" />
      } else if (item.id === "videos") {
        return <Video className="h-4 w-4 text-blue-500" />
      }
      return <Folder className="h-4 w-4 text-blue-500" />
    } else {
      return <File className="h-4 w-4 text-gray-500" />
    }
  }

  // Toggle expand icon
  const ExpandIcon = ({ isExpanded, onClick }: { isExpanded: boolean; onClick: () => void }) => {
    return isExpanded ? (
      <ChevronDown className="h-4 w-4 text-blue-500 cursor-pointer" onClick={onClick} />
    ) : (
      <ChevronRight className="h-4 w-4 text-blue-500 cursor-pointer" onClick={onClick} />
    )
  }

  // Create a new file in a folder
  const createNewFile = (parentId: string) => {
    if (!newFileName.trim()) return

    const newFile: FileSystemItem = {
      id: `file-${Date.now()}`,
      name: newFileName,
      type: "file",
      path: `${actionTarget?.path}/${newFileName}`,
      size: 0,
    }

    setData((prevData) => {
      const updateChildren = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map((item) => {
          if (item.id === parentId) {
            return {
              ...item,
              children: [...(item.children || []), newFile],
            }
          } else if (item.children) {
            return {
              ...item,
              children: updateChildren(item.children),
            }
          }
          return item
        })
      }
      return updateChildren(prevData)
    })

    setNewFileName("")
    setShowFileActions(false)
    setActionTarget(null)
  }

  // Move a file to another folder
  const moveFile = () => {
    if (!moveTarget || !moveDestination) return

    setData((prevData) => {
      // First, remove the file from its original location
      let fileToMove: FileSystemItem | null = null

      const removeFile = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.filter((item) => {
          if (item.id === moveTarget.id) {
            fileToMove = item
            return false
          }
          if (item.children) {
            item.children = removeFile(item.children)
          }
          return true
        })
      }

      let newData = removeFile([...prevData])

      // Then add it to the new location
      if (fileToMove) {
        const addFile = (items: FileSystemItem[]): FileSystemItem[] => {
          return items.map((item) => {
            if (item.id === moveDestination) {
              return {
                ...item,
                children: [
                  ...(item.children || []),
                  {
                    ...fileToMove!,
                    path: `${item.path}/${fileToMove!.name}`,
                  },
                ],
              }
            } else if (item.children) {
              return {
                ...item,
                children: addFile(item.children),
              }
            }
            return item
          })
        }

        newData = addFile(newData)
      }

      return newData
    })

    setMoveTarget(null)
    setMoveDestination(null)
    setShowFileActions(false)
  }

  // Show file actions menu
  const showActions = (item: FileSystemItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActionTarget(item)
    setShowFileActions(true)
  }

  // Render a file system item
  const renderItem = (item: FileSystemItem, depth = 0) => {
    const isExpanded = expandedItems[item.id] || false
    const hasChildren = item.children && item.children.length > 0
    const isSelected = selectedItem === item.id

    return (
      <div key={item.id} className="select-none">
        <div
          className={cn(
            "flex items-center py-1 px-2 hover:bg-blue-100 rounded cursor-pointer",
            isSelected && "bg-blue-200",
          )}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
          onClick={() => handleSelect(item)}
          onContextMenu={(e) => showActions(item, e)}
        >
          <div className="mr-1">
            {hasChildren ? (
              <ExpandIcon isExpanded={isExpanded} onClick={() => toggleExpand(item.id)} />
            ) : (
              <div className="w-4" />
            )}
          </div>
          <div className="mr-2">{getItemIcon(item)}</div>
          <div className="flex-1 truncate">{item.name}</div>
          {item.size !== undefined && (
            <div className="text-sm text-gray-500 ml-2">{(item.size / (1024 * 1024)).toFixed(2)} MB</div>
          )}
        </div>

        {isExpanded && hasChildren && <div>{item.children!.map((child) => renderItem(child, depth + 1))}</div>}
      </div>
    )
  }

  // Render all items in the file explorer
  const renderItems = () => {
    return (
      <div className="overflow-auto max-h-[32rem]">
        {/* Quick Access Section */}
        <div className="mb-4">
          <div
            className="flex items-center py-1 px-2 font-medium text-sm cursor-pointer"
            onClick={() => setShowQuickAccess(!showQuickAccess)}
          >
            <ExpandIcon isExpanded={showQuickAccess} onClick={() => setShowQuickAccess(!showQuickAccess)} />
            <span className="ml-1">Quick Access</span>
          </div>

          {showQuickAccess && <div className="ml-4">{quickAccessItems.map((item) => renderItem(item, 0))}</div>}
        </div>

        {/* Hard Drives Section */}
        <div>
          <div className="py-1 px-2 font-medium text-sm">Hard Drives</div>
          {data.map((item) => renderItem(item, 0))}
        </div>
      </div>
    )
  }

  // Render file actions menu
  const renderFileActions = () => {
    if (!showFileActions || !actionTarget) return null

    return (
      <div className="absolute z-10 bg-white shadow-lg rounded-md border border-gray-200 p-2 w-60">
        <div className="font-medium mb-2">{actionTarget.name}</div>

        {actionTarget.type === "folder" && (
          <>
            <div className="mb-2">
              <div className="text-sm font-medium mb-1">Create new file</div>
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 border rounded-l px-2 py-1 text-sm"
                  placeholder="File name"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                />
                <button
                  className="bg-blue-500 text-white rounded-r px-2 py-1 text-sm flex items-center"
                  onClick={() => createNewFile(actionTarget.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </button>
              </div>
            </div>
          </>
        )}

        {actionTarget.type === "file" && (
          <div className="mb-2">
            <div className="text-sm font-medium mb-1">Move file to folder</div>
            <select
              className="w-full border rounded px-2 py-1 text-sm mb-2"
              onChange={(e) => setMoveDestination(e.target.value)}
              value={moveDestination || ""}
            >
              <option value="">Select destination</option>
              {data.flatMap(
                (drive) =>
                  drive.children
                    ?.filter((item) => item.type === "folder")
                    .map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    )) || [],
              )}
              {quickAccessItems.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <button
              className="bg-blue-500 text-white rounded px-2 py-1 text-sm flex items-center"
              onClick={() => {
                setMoveTarget(actionTarget)
                moveFile()
              }}
              disabled={!moveDestination}
            >
              <Move className="h-3 w-3 mr-1" />
              Move
            </button>
          </div>
        )}

        <div className="text-right">
          <button className="text-sm text-gray-500" onClick={() => setShowFileActions(false)}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border rounded-md p-2 bg-white relative", className)}>
      {renderItems()}
      {renderFileActions()}
    </div>
  )
}
