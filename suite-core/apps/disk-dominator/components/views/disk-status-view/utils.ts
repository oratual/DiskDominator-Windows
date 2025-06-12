import type { DiskStatus } from "./types"

// Update the getDiskScanningState function to also check for completed disks
export function getDiskScanningState(disks: DiskStatus[]): "idle" | "paused" | "quick-scanning" | "slow-scanning" | "completed" {
  // Check if any disk is in scanning state and not paused
  const hasQuickScanning = disks.some((d) => d.status === "scanning" && d.scanType === "quick" && !d.isPaused)
  const hasSlowScanning = disks.some((d) => d.status === "scanning" && d.scanType === "slow" && !d.isPaused)
  // Check if any disk is paused
  const hasPausedScanning = disks.some((d) => (d.status === "scanning" || d.status === "paused") && d.isPaused)
  // Check if all disks have completed their scans
  const allCompleted = disks.length > 0 && disks.every((d) => d.status === "complete")

  if (allCompleted) return "completed"
  if (hasPausedScanning) return "paused"
  if (hasQuickScanning) return "quick-scanning"
  if (hasSlowScanning) return "slow-scanning"
  return "idle"
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "Completado"

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}s restantes`
  }

  return `${minutes}m ${remainingSeconds}s restantes`
}

export function getStatusText(status: string, isPaused?: boolean): string {
  if (isPaused) return "Pausado"

  switch (status) {
    case "scanning":
      return "Escaneando"
    case "complete":
      return "Completado"
    case "error":
      return "Error"
    case "paused":
      return "Pausado"
    default:
      return "Pendiente"
  }
}

export function getScanTypeText(scanType: "quick" | "slow" | null): string {
  if (!scanType) return ""
  return scanType === "quick" ? "Escaneo para Duplicados y Archivos Gigantes" : "Escaneo para Ordenar Discos"
}

// Helper function for singular/plural text
export function formatSingularPlural(count: number, singularText: string, pluralText: string) {
  return count === 1 ? singularText : pluralText
}
