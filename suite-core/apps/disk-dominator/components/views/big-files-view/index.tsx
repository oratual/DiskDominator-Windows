"use client"
import React from "react";

import { useState, useRef, useEffect, useCallback } from "react"
import { HelpCircle, Zap, RefreshCw, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AIAssistant } from "./components/ai-assistant"
import { FileSidebar } from "./components/file-sidebar"
import { FileListView } from "./components/file-list-view"
import { FileExplorerView } from "./components/file-explorer-view"
import { StorageStats } from "./components/storage-stats"
import { useLargeFiles, LargeFileFilter } from "@/hooks/use-large-files"
import { useFileSpaceAnalysis } from "@/hooks/useFileSpaceAnalysis"
import { useFileCompression } from "@/hooks/useFileCompression"
import { useDiskScanner } from "@/hooks/use-disk-scanner"
import type { FileItem } from "./types"

export default function BigFilesView() {
  // Main state
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [selectedView, setSelectedView] = useState("list")
  const [selectedType, setSelectedType] = useState("all")
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [minFileSize, setMinFileSize] = useState("1gb")
  const [sortBy, setSortBy] = useState("size")
  const [sortDirection, setSortDirection] = useState("desc")
  const [currentPath, setCurrentPath] = useState("C:/")
  const [chatExpanded, setChatExpanded] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [activeDisk, setActiveDisk] = useState("all")
  const [showStats, setShowStats] = useState(true)
  const [fileTypes, setFileTypes] = useState<string[]>([])  // For filtering
  const [initialized, setInitialized] = useState(false)

  // Size slider state (in bytes)
  const [minSize, setMinSize] = useState(1024 * 1024 * 1024) // 1GB default
  const [maxSize, setMaxSize] = useState(10 * 1024 * 1024 * 1024) // 10GB default
  const [minSizeThumb, setMinSizeThumb] = useState(20) // Posición en porcentaje (0-100)
  const [maxSizeThumb, setMaxSizeThumb] = useState(80) // Posición en porcentaje (0-100)

  // Disk selection state
  const [selectedDisks, setSelectedDisks] = useState<string[]>([])
  const [availableDisks, setAvailableDisks] = useState<Array<{ name: string; used: number; total: number; percentage: number }>>([])  // Initialize as empty array

  // AI Assistant states
  const [chatWidth, setChatWidth] = useState(300)
  const [isResizingChat, setIsResizingChat] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const chatResizeRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Hooks for data management
  const {
    files,
    loading: filesLoading,
    error: filesError,
    spaceAnalysis,
    findLargeFiles,
    analyzeSpace,
    compressFile,
    deleteFiles,
    previewFile,
    formatBytes,
    getFileIcon,
    getCompressionColor,
    getSizeCategory
  } = useLargeFiles()
  
  const { analysis: detailedAnalysis, analyzeSpace: analyzeDetailedSpace } = useFileSpaceAnalysis()
  const { compressFile: compressWithProgress, jobs: compressionJobs, suggestCompressionFormat } = useFileCompression()
  const { startScan } = useDiskScanner()
  
  // Mock function for getDisks - replace with real implementation
  const getDisks = useCallback(async () => {
    return [
      { mount_point: 'C:', name: 'Disco Local (C:)', used_space: 500000000000, total_space: 1000000000000 },
      { mount_point: 'D:', name: 'Datos (D:)', used_space: 750000000000, total_space: 2000000000000 }
    ]
  }, [])

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get available disks
        const diskInfo = await getDisks()
        if (diskInfo && diskInfo.length > 0) {
          setAvailableDisks(diskInfo.map(disk => ({
            name: disk.mount_point || disk.name,
            used: disk.used_space,
            total: disk.total_space,
            percentage: (disk.used_space / disk.total_space) * 100
          })))
          // Select all disks by default
          setSelectedDisks(diskInfo.map(disk => disk.mount_point || disk.name))
        }
        
        // Find large files with default filter
        const filter: LargeFileFilter = {
          min_size: minSize,
          max_size: maxSize,
          sort_by: sortBy,
          sort_order: sortDirection
        }
        await findLargeFiles(filter)
        
        // Analyze space
        await analyzeSpace()
        
        setInitialized(true)
      } catch (error) {
        console.error('Failed to initialize data:', error)
      }
    }
    
    if (!initialized) {
      initializeData()
    }
  }, [initialized, minSize, maxSize, sortBy, sortDirection, findLargeFiles, analyzeSpace, getDisks])
  
  // Update file search when filters change
  useEffect(() => {
    if (!initialized) return
    
    const updateFiles = async () => {
      const filter: LargeFileFilter = {
        min_size: minSize,
        max_size: maxSize,
        paths: selectedDisks.length > 0 ? selectedDisks : undefined,
        file_types: fileTypes.length > 0 ? fileTypes : undefined,
        sort_by: sortBy,
        sort_order: sortDirection
      }
      await findLargeFiles(filter)
    }
    
    updateFiles()
  }, [minSize, maxSize, selectedDisks, fileTypes, sortBy, sortDirection, initialized, findLargeFiles])
  
  // Show file preview
  const openPreview = async (file: FileItem | any) => {
    try {
      const preview = await previewFile(file.path)
      setPreviewItem({ ...file, preview })
      setShowPreview(true)
    } catch (error) {
      console.error('Failed to preview file:', error)
    }
  }
  
  // Handle compression
  const handleCompressFile = async (file: any) => {
    const options = suggestCompressionFormat(file.file_type, file.size)
    try {
      await compressWithProgress(file.path, file.name, options)
      // Refresh files list
      const filter: LargeFileFilter = {
        min_size: minSize,
        max_size: maxSize,
        paths: selectedDisks.length > 0 ? selectedDisks : undefined,
        file_types: fileTypes.length > 0 ? fileTypes : undefined,
        sort_by: sortBy,
        sort_order: sortDirection
      }
      await findLargeFiles(filter)
    } catch (error) {
      console.error('Failed to compress file:', error)
    }
  }
  
  // Handle delete
  const handleDeleteFiles = async (fileIds: string[]) => {
    try {
      await deleteFiles(fileIds, true) // Move to trash by default
      // Files list will be automatically updated by the hook
    } catch (error) {
      console.error('Failed to delete files:', error)
    }
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

  // Apply readability settings
  useEffect(() => {
    // Apply readability classes to the component container
    const applyReadabilitySettings = () => {
      const container = document.querySelector(".big-files-container")
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

  return (
    <div
      ref={containerRef}
      className="flex flex-1 h-full overflow-hidden dark:bg-gray-900 dark:text-white big-files-container"
    >
      {/* Left Panel - Chat with AI */}
      <AIAssistant
        chatWidth={chatWidth}
        chatCollapsed={chatCollapsed}
        setChatCollapsed={setChatCollapsed}
        isResizingChat={isResizingChat}
        startResizingChat={startResizingChat}
      />

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

      {/* Left Panel - Options */}
      <FileSidebar
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        selectedDisks={selectedDisks}
        setSelectedDisks={setSelectedDisks}
        availableDisks={availableDisks}
        minSizeThumb={minSizeThumb}
        maxSizeThumb={maxSizeThumb}
        setMinSizeThumb={setMinSizeThumb}
        setMaxSizeThumb={setMaxSizeThumb}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
      />

      {/* Right Content - File List and Explorer */}
      <div className="flex-1 flex flex-col h-full">
        {/* Action Bar */}
        <div className="bg-white dark:bg-gray-800 px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-lg font-medium">Archivos y carpetas de gran tamaño</h2>
            <span className="ml-3 text-sm text-gray-500 dark:text-gray-300">
              {files.length} elementos • {formatBytes(files.reduce((total, file) => total + file.size, 0))}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={async () => {
                const filter: LargeFileFilter = {
                  min_size: minSize,
                  max_size: maxSize,
                  paths: selectedDisks.length > 0 ? selectedDisks : undefined,
                  file_types: fileTypes.length > 0 ? fileTypes : undefined,
                  sort_by: sortBy,
                  sort_order: sortDirection
                }
                await findLargeFiles(filter)
                await analyzeSpace(selectedDisks.length > 0 ? selectedDisks : undefined)
              }}
              disabled={filesLoading}
            >
              <RefreshCw size={16} className={`mr-2 ${filesLoading ? 'animate-spin' : ''}`} />
              {filesLoading ? 'Escaneando...' : 'Actualizar'}
            </Button>
            <Button variant="outline" className="flex items-center">
              <Zap size={16} className="mr-2" />
              Sugerencias de la IA
            </Button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-6 min-h-0">
          {/* Storage Stats */}
          {showStats && spaceAnalysis && (
            <StorageStats 
              analysis={spaceAnalysis} 
              className="mb-6"
            />
          )}
          
          {/* Error State */}
          {filesError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-600 dark:text-red-400">{filesError}</p>
            </div>
          )}
          
          {/* Loading State */}
          {filesLoading && files.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-pulse" />
                <p className="text-gray-500 dark:text-gray-400">Buscando archivos grandes...</p>
              </div>
            </div>
          )}
          
          {/* List View */}
          {selectedView === "list" && !filesLoading && (
            <FileListView 
              files={files} 
              openPreview={openPreview}
              onCompress={handleCompressFile}
              onDelete={(fileIds) => handleDeleteFiles(fileIds)}
              formatBytes={formatBytes}
              getFileIcon={getFileIcon}
              getCompressionColor={getCompressionColor}
              compressionJobs={compressionJobs}
            />
          )}

          {/* Explorer View */}
          {selectedView === "explorer" && <FileExplorerView />}
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between sticky bottom-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-300">
              Archivos mostrados: <span className="font-medium">{files.length}</span>
            </span>
            {spaceAnalysis && (
              <span className="text-sm text-gray-500 dark:text-gray-300">
                Espacio total: <span className="font-medium">{formatBytes(spaceAnalysis.total_size)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" className="flex items-center">
              <HelpCircle size={16} className="mr-2" />
              Ayuda
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
