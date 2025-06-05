import type { FileItem } from "./types"
import { File, Folder, ImageIcon, FileVideo, Package, Database, Archive, HardDrive } from "lucide-react"

// Format size to readable format
export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B"
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  else if (bytes < 1024 * 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  else return (bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2) + " TB"
}

// Format date to readable format
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// Get icon based on file type
export const getFileIcon = (type: string) => {
  switch (type) {
    case "video":
      return <FileVideo size={20} className="text-red-500" />
    case "archive":
      return <Archive size={20} className="text-yellow-500" />
    case "image":
      return <ImageIcon size={20} className="text-purple-500" />
    case "folder":
      return <Folder size={20} className="text-blue-500" />
    case "disk":
      return <HardDrive size={20} className="text-gray-500" />
    case "database":
      return <Database size={20} className="text-green-500" />
    case "3d":
      return <Package size={20} className="text-indigo-500" />
    default:
      return <File size={20} className="text-gray-500" />
  }
}

// Calculate percentage of disk usage
export const calculatePercentage = (used: number, total: number): number => {
  return Math.round((used / total) * 100)
}

// Get color based on percentage
export const getPercentageColor = (percentage: number): string => {
  if (percentage < 60) return "bg-green-500"
  if (percentage < 85) return "bg-yellow-500"
  return "bg-red-500"
}

// Check if file was accessed in the last month
export const isRecentlyAccessed = (dateStr: string): boolean => {
  const date = new Date(dateStr)
  const now = new Date()
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(now.getMonth() - 1)
  return date > oneMonthAgo
}

// Convert slider position to file size
export const thumbPositionToSize = (position: number): string => {
  // Mapear la posición (0-100) a un tamaño en bytes
  // Escala logarítmica: 10MB a 1TB
  const minBytes = 10 * 1024 * 1024 // 10 MB
  const maxBytes = 1024 * 1024 * 1024 * 1024 // 1 TB

  // Calcular el tamaño en bytes basado en la posición
  const factor = position / 100
  // Usar escala logarítmica para mejor distribución
  const logMin = Math.log(minBytes)
  const logMax = Math.log(maxBytes)
  const bytes = Math.exp(logMin + factor * (logMax - logMin))

  return formatSize(bytes)
}

// Sample large files data
export const largeFiles: FileItem[] = [
  {
    id: 1,
    name: "Proyecto_Final_4K.mp4",
    path: "C:/Videos/Proyectos/2023/",
    type: "video",
    size: 1.2 * 1024 * 1024 * 1024 * 1024, // 1.2 TB
    lastAccessed: "2023-11-15",
    lastModified: "2023-10-30",
    metadata: {
      duration: "02:45:13",
      resolution: "3840x2160",
      bitrate: "120 Mbps",
      codec: "H.265/HEVC",
    },
  },
  {
    id: 2,
    name: "Backup_Sistema_Completo.img",
    path: "D:/Backups/",
    type: "archive",
    size: 500 * 1024 * 1024 * 1024, // 500 GB
    lastAccessed: "2024-01-05",
    lastModified: "2024-01-05",
    metadata: {
      compressionType: "None",
      encrypted: "No",
      description: "Imagen completa del sistema",
    },
  },
  {
    id: 3,
    name: "Dataset_Imagenes_8K.zip",
    path: "E:/Datasets/",
    type: "archive",
    size: 320 * 1024 * 1024 * 1024, // 320 GB
    lastAccessed: "2023-12-12",
    lastModified: "2023-08-20",
    metadata: {
      fileCount: "15,432",
      compressionRatio: "1.8:1",
      encrypted: "No",
    },
  },
  {
    id: 4,
    name: "VM_Windows11_Dev.vhdx",
    path: "C:/Users/User/VirtualBox VMs/",
    type: "disk",
    size: 250 * 1024 * 1024 * 1024, // 250 GB
    lastAccessed: "2024-02-28",
    lastModified: "2024-02-25",
    metadata: {
      format: "VHDX",
      dynamicAllocation: "Yes",
      operatingSystem: "Windows 11 Pro",
    },
  },
  {
    id: 5,
    name: "RawFootage_Drone",
    path: "D:/Media/Drone/",
    type: "folder",
    size: 180 * 1024 * 1024 * 1024, // 180 GB
    lastAccessed: "2023-09-10",
    lastModified: "2023-09-01",
    fileCount: 246,
    metadata: {
      fileTypes: "MP4, MOV, DNG",
    },
  },
]

// Stats about storage
export const storageStats = {
  totalSpace: 4 * 1024 * 1024 * 1024 * 1024, // 4 TB
  usedSpace: 2.7 * 1024 * 1024 * 1024 * 1024, // 2.7 TB
  largeFilesSpace: 2.1 * 1024 * 1024 * 1024 * 1024, // 2.1 TB
  diskUsage: {
    "C:": {
      total: 1 * 1024 * 1024 * 1024 * 1024,
      used: 600 * 1024 * 1024 * 1024,
      largeFiles: 439 * 1024 * 1024 * 1024,
    },
    "D:": {
      total: 2 * 1024 * 1024 * 1024 * 1024,
      used: 1.5 * 1024 * 1024 * 1024 * 1024,
      largeFiles: 835 * 1024 * 1024 * 1024,
    },
    "E:": {
      total: 1 * 1024 * 1024 * 1024 * 1024,
      used: 600 * 1024 * 1024 * 1024,
      largeFiles: 320 * 1024 * 1024 * 1024,
    },
  },
  fileTypes: {
    video: 1.2 * 1024 * 1024 * 1024 * 1024,
    archive: 820 * 1024 * 1024 * 1024,
    disk: 250 * 1024 * 1024 * 1024,
    database: 165 * 1024 * 1024 * 1024,
    folders: 335 * 1024 * 1024 * 1024,
    other: 30 * 1024 * 1024 * 1024,
  },
}

// Available disks
export const availableDisks = [
  { id: "C", label: "Disco C:", path: "C:/", color: "blue", usedSpace: 600, totalSpace: 1000 },
  { id: "D", label: "Disco D:", path: "D:/", color: "green", usedSpace: 1500, totalSpace: 2000 },
  { id: "E", label: "Disco E:", path: "E:/", color: "yellow", usedSpace: 600, totalSpace: 1000 },
  { id: "J", label: "Disco J:", path: "J:/", color: "purple", usedSpace: 200, totalSpace: 1000 },
]

// Get age indicator based on last accessed date
export const getAgeIndicator = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 6)
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(now.getFullYear() - 1)

  if (date > sixMonthsAgo) {
    return <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Reciente</span>
  } else if (date > oneYearAgo) {
    return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">6+ meses</span>
  } else {
    return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">1+ año</span>
  }
}
