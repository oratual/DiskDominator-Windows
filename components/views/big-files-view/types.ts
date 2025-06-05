export interface FileMetadata {
  duration?: string
  resolution?: string
  bitrate?: string
  codec?: string
  compressionType?: string
  encrypted?: string
  description?: string
  fileCount?: string
  compressionRatio?: string
  format?: string
  dynamicAllocation?: string
  operatingSystem?: string
  fileTypes?: string
}

export interface FileItem {
  id: number
  name: string
  path: string
  type: string
  size: number
  lastAccessed: string
  lastModified: string
  metadata: FileMetadata
  fileCount?: number
}

export interface DiskUsage {
  total: number
  used: number
  largeFiles: number
}

export interface FileTypes {
  [key: string]: number
}

export interface StorageStats {
  totalSpace: number
  usedSpace: number
  largeFilesSpace: number
  diskUsage: {
    [key: string]: DiskUsage
  }
  fileTypes: FileTypes
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ViewProps {
  selectedView: string
  setSelectedView: (view: string) => void
}
