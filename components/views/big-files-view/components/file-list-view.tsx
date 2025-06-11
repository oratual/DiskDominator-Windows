import React from "react";
import React from "react";
import React from "react";
"use client"

import { Eye, FolderOpen, Copy, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { FileItem } from "../types"
import { formatDate, formatSize, getAgeIndicator, getFileIcon } from "../utils"

interface FileListViewProps {
  files: FileItem[]
  openPreview: (file: FileItem) => void
}

export function FileListView({ files, openPreview }: FileListViewProps) {
  return (
    <Card className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Nombre
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Ubicación
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Tamaño
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Último acceso
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {files.map((file) => (
            <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getFileIcon(file.type)}
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      {file.name}
                      {file.type === "video" && (
                        <span className="ml-2 text-xs text-gray-500">({file.metadata.resolution})</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {file.type === "folder" ? `${file.fileCount} archivos` : file.type.toUpperCase()}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900 dark:text-gray-300">{file.path}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatSize(file.size)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-900">{formatDate(file.lastAccessed).split(" ")[0]}</span>
                  {getAgeIndicator(file.lastAccessed)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <div className="flex justify-end items-center space-x-2">
                  {file.type !== "folder" && (
                    <button className="text-purple-600 hover:text-purple-900" onClick={() => openPreview(file)}>
                      <Eye size={18} />
                    </button>
                  )}
                  <button className="text-blue-600 hover:text-blue-900">
                    <FolderOpen size={18} />
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    <Copy size={18} />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
