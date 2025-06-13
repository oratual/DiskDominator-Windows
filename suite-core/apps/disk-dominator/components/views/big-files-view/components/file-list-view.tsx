"use client"
import React, { useState } from "react";

import { Eye, FolderOpen, Copy, Trash2, Archive, CheckSquare, Square } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { LargeFileInfo } from "@/hooks/use-large-files"
import type { CompressionJob } from "@/hooks/useFileCompression"

interface FileListViewProps {
  files: LargeFileInfo[]
  openPreview: (file: any) => void
  onCompress?: (file: LargeFileInfo) => void
  onDelete?: (fileIds: string[]) => void
  formatBytes: (bytes: number) => string
  getFileIcon: (fileType: string) => string
  getCompressionColor: (potential: number) => string
  compressionJobs?: CompressionJob[]
}

export function FileListView({ 
  files, 
  openPreview, 
  onCompress, 
  onDelete, 
  formatBytes, 
  getFileIcon,
  getCompressionColor,
  compressionJobs = []
}: FileListViewProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  
  const toggleSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };
  
  const selectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };
  
  const deleteSelected = () => {
    if (onDelete && selectedFiles.size > 0) {
      onDelete(Array.from(selectedFiles));
      setSelectedFiles(new Set());
    }
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const getCompressionJob = (filePath: string) => {
    return compressionJobs.find(job => job.filePath === filePath);
  };
  return (
    <Card className="overflow-hidden">
      {selectedFiles.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedFiles.size} archivo{selectedFiles.size > 1 ? 's' : ''} seleccionado{selectedFiles.size > 1 ? 's' : ''}
            </span>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={deleteSelected}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar selección
            </Button>
          </div>
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-3 py-3 text-left">
              <button 
                onClick={selectAll}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              >
                {selectedFiles.size === files.length ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
              </button>
            </th>
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
              Última modificación
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Compresión
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
          {files.map((file) => {
            const compressionJob = getCompressionJob(file.path);
            const isCompressing = compressionJob?.status === 'compressing';
            
            return (
            <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-3 py-4">
                <button 
                  onClick={() => toggleSelection(file.id)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  {selectedFiles.has(file.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getFileIcon(file.file_type)}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="uppercase">{file.extension || file.file_type}</span>
                      {file.disk && <span className="ml-2">• Disco {file.disk}</span>}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900 dark:text-gray-300">{file.path}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatBytes(file.size)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-900 dark:text-gray-300">{formatDate(file.modified)}</span>
                  <span className="text-xs text-gray-500">
                    Creado: {formatDate(file.created)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className={`text-sm font-medium ${getCompressionColor(file.compression_potential)}`}>
                          {Math.round(file.compression_potential * 100)}%
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Potencial de compresión estimado</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {compressionJob && (
                    <Badge variant={compressionJob.status === 'completed' ? 'success' : compressionJob.status === 'failed' ? 'destructive' : 'default'}>
                      {compressionJob.status === 'compressing' ? 'Comprimiendo...' : compressionJob.status}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <div className="flex justify-end items-center space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300" 
                          onClick={() => openPreview(file)}
                        >
                          <Eye size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Vista previa</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          <FolderOpen size={18} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Abrir ubicación</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {onCompress && file.compression_potential > 0.2 && !isCompressing && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            onClick={() => onCompress(file)}
                            disabled={isCompressing}
                          >
                            <Archive size={18} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Comprimir archivo</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {onDelete && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => onDelete([file.id])}
                          >
                            <Trash2 size={18} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar archivo</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  )
}
