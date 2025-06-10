// Types for our disk data
export interface DiskStatus {
  id: string
  name: string
  status: "scanning" | "pending" | "complete" | "error" | "paused"
  scanType: "quick" | "slow" | null
  progress: number
  quickScanProgress?: number
  slowScanProgress?: number
  canAnalyzeDuplicates: boolean
  canOrganize: boolean
  estimatedTimeRemaining?: number // in seconds
  size: string
  used: string
  free: string
  isPaused?: boolean
}

export interface AIMessage {
  role: "user" | "assistant"
  content: string
}

// Color associations for features
export const FEATURE_COLORS = {
  duplicates: "blue",
  largeFiles: "green",
  organize: "purple",
}
