import React from "react";
import React from "react";
"use client"
import { X, FileText, Folder, HardDrive, Calendar, User, Hash } from "lucide-react"

interface FilePropertiesDialogProps {
  isOpen: boolean
  onClose: () => void
  fileInfo: {
    name: string
    path: string
    type: "file" | "folder" | "drive"
    size?: number
    created?: string
    modified?: string
    accessed?: string
    owner?: string
  } | null
}

export function FilePropertiesDialog({ isOpen, onClose, fileInfo }: FilePropertiesDialogProps) {
  if (!isOpen || !fileInfo) return null

  // Format size in human-readable format
  const formatSize = (bytes?: number): string => {
    if (bytes === undefined) return "-"
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB"
  }

  // Get icon based on file type
  const getFileIcon = () => {
    switch (fileInfo.type) {
      case "file":
        return <FileText className="w-12 h-12 text-blue-500" />
      case "folder":
        return <Folder className="w-12 h-12 text-yellow-500" />
      case "drive":
        return <HardDrive className="w-12 h-12 text-black" />
      default:
        return <FileText className="w-12 h-12 text-gray-500" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{fileInfo.name} Properties</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center mb-6">
            {getFileIcon()}
            <div className="ml-4">
              <h4 className="font-medium">{fileInfo.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {fileInfo.type.charAt(0).toUpperCase() + fileInfo.type.slice(1)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Hash className="w-4 h-4 mr-2" />
                Type:
              </div>
              <div className="text-sm">{fileInfo.type.charAt(0).toUpperCase() + fileInfo.type.slice(1)}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <User className="w-4 h-4 mr-2" />
                Location:
              </div>
              <div className="text-sm break-all">{fileInfo.path}</div>
            </div>

            {fileInfo.size !== undefined && (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Hash className="w-4 h-4 mr-2" />
                  Size:
                </div>
                <div className="text-sm">{formatSize(fileInfo.size)}</div>
              </div>
            )}

            {fileInfo.created && (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  Created:
                </div>
                <div className="text-sm">{fileInfo.created}</div>
              </div>
            )}

            {fileInfo.modified && (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  Modified:
                </div>
                <div className="text-sm">{fileInfo.modified}</div>
              </div>
            )}

            {fileInfo.accessed && (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  Accessed:
                </div>
                <div className="text-sm">{fileInfo.accessed}</div>
              </div>
            )}

            {fileInfo.owner && (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <User className="w-4 h-4 mr-2" />
                  Owner:
                </div>
                <div className="text-sm">{fileInfo.owner}</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
