import { Check, Info, FileText, Copy, LayoutGrid, Pause, Zap, HardDrive } from "lucide-react"
import type { DiskStatus } from "../types"
import { getDiskScanningState, formatSingularPlural } from "../utils"

interface DiskStatusMessageProps {
  disks: DiskStatus[]
}

export function DiskStatusMessage({ disks }: DiskStatusMessageProps) {
  // Calculate disk status
  const disksWithQuickScanComplete = disks.filter((d) => (d.quickScanProgress || 0) === 100)
  const disksWithFullScanComplete = disks.filter((d) => (d.slowScanProgress || 0) === 100)
  const pausedDisks = disks.filter((d) => (d.status === "scanning" || d.status === "paused") && d.isPaused)

  // Determine the scanning state for animation
  const scanningState = getDiskScanningState(disks)
  console.log("Current scanning state:", scanningState) // Debug logging

  // Determine which message to show
  let message = ""
  let iconColor = "text-[hsl(var(--color-info-blue))] dark:text-[hsl(var(--color-info-blue-dark))]"

  // Set icon color based on scanning state
  if (scanningState === "paused") {
    iconColor = "text-[hsl(var(--destructive))] dark:text-[hsl(var(--destructive))]"
  } else if (scanningState === "quick-scanning") {
    iconColor = "text-[hsl(var(--color-success-green))] dark:text-[hsl(var(--color-success-green-dark))]"
  } else if (scanningState === "slow-scanning") {
    iconColor = "text-[hsl(var(--color-organize-purple))] dark:text-[hsl(var(--color-organize-purple-dark))]"
  } else if (scanningState === "completed") {
    iconColor = "text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]"
  }

  let icon = <Info className={`h-6 w-6 ${iconColor}`} />

  // Case 1: No disks have been scanned
  if (disksWithQuickScanComplete.length === 0) {
    const diskText = formatSingularPlural(disks.length, "el disco se escanee", "los discos se escaneen")
    message = `Espera a que ${diskText}. Aquí te iré avisando cuando ${disks.length === 1 ? "esté listo" : "estén listos"}.`
  }
  // Case 2: Some disks have completed quick scan but not all
  else if (disksWithQuickScanComplete.length > 0 && disksWithQuickScanComplete.length < disks.length) {
    const diskNames = disksWithQuickScanComplete.map((d) => d.name).join(", ")
    const diskText = disksWithQuickScanComplete.length === 1 ? "el disco" : "los discos"
    message = `Puedes usar las funciones de "Duplicados" y "Archivos Gigantes" en ${diskText} que ha${disksWithQuickScanComplete.length === 1 ? "" : "n"} completado el escaneo rápido (${diskNames}). Puedes ir echándole un vistazo a los archivos gigantes mientras termina${disks.length - disksWithQuickScanComplete.length === 1 ? "" : "n"} ${disks.length - disksWithQuickScanComplete.length === 1 ? "el otro disco" : "los demás discos"}.`
    icon = <FileText className={`h-6 w-6 ${iconColor}`} />
  }
  // Case 3: All disks have completed quick scan but none have completed full scan
  else if (disksWithQuickScanComplete.length === disks.length && disksWithFullScanComplete.length === 0) {
    const diskText = formatSingularPlural(disks.length, "el disco", "todos los discos")
    message = `Ya puedes usar las funciones de "Duplicados" y "Archivos Gigantes" en ${diskText}. Cuando termine${disks.length === 1 ? "" : "n"} el escaneo completo podrás usar "Ordenar Disco". Te avisaré cuando suceda.`
    icon = <Copy className={`h-6 w-6 ${iconColor}`} />
  }
  // Case 4: All completed quick scan and some completed full scan
  else if (
    disksWithQuickScanComplete.length === disks.length &&
    disksWithFullScanComplete.length > 0 &&
    disksWithFullScanComplete.length < disks.length
  ) {
    const organizeDisks = disksWithFullScanComplete.map((d) => d.name).join(", ")
    const fullScanText =
      disksWithFullScanComplete.length === 1
        ? `el disco: ${organizeDisks}, que ha completado`
        : `los discos: ${organizeDisks}, que han completado`
    message = `Ya puedes usar "Duplicados" y "Archivos Gigantes" en todos los discos y puedes empezar a ordenar ${fullScanText} el escaneo completo.`
    icon = <LayoutGrid className={`h-6 w-6 ${iconColor}`} />
  }
  // Case 5: Some disks have completed quick scan and some have completed full scan (but not all have quick)
  else if (
    disksWithQuickScanComplete.length > 0 &&
    disksWithQuickScanComplete.length < disks.length &&
    disksWithFullScanComplete.length > 0
  ) {
    const quickDisks = disksWithQuickScanComplete.map((d) => d.name).join(", ")
    const quickText = disksWithQuickScanComplete.length === 1 ? `el disco ${quickDisks}` : `los discos ${quickDisks}`

    const fullDisks = disksWithFullScanComplete.map((d) => d.name).join(", ")
    const fullText =
      disksWithFullScanComplete.length === 1
        ? `el disco ${fullDisks}, que ha terminado`
        : `los discos ${fullDisks}, que han terminado`

    message = `Ya puedes usar "Duplicados" y "Archivos Gigantes" en ${quickText} y puedes empezar a ordenar ${fullText} el escaneo completo.`
    icon = <LayoutGrid className={`h-6 w-6 ${iconColor}`} />
  }
  // Case 6: All disks have completed all scans
  else if (disksWithFullScanComplete.length === disks.length) {
    const diskText = formatSingularPlural(disks.length, "el disco", "todos los discos")
    message = `¡Enhorabuena! Ya puedes usar todas las pestañas: "Duplicados", "Archivos Gigantes" y "Ordenar Disco" en ${diskText}.`
    icon = <Check className={`h-6 w-6 ${iconColor}`} />
  }

  // If there are paused disks, add a message about them
  if (pausedDisks.length > 0) {
    const pausedDiskNames = pausedDisks.map((d) => d.name).join(", ")
    const pausedText =
      pausedDisks.length === 1
        ? `El escaneo de ${pausedDiskNames} está pausado. Reanúdalo para continuar.`
        : `El escaneo de ${pausedDiskNames} está pausado. Reanúdalos para continuar.`

    // If there's already a message, append to it, otherwise set it
    if (message) {
      message = `${message} ${pausedText}`
    } else {
      message = pausedText
    }

    // Update icon for paused state
    icon = <Pause className={`h-6 w-6 text-[hsl(var(--destructive))] dark:text-[hsl(var(--destructive))]`} />
  }

  // Determine animation class based on scanning state
  let animationClass = ""
  if (scanningState === "quick-scanning") {
    animationClass = "construction-animation-quick"
  } else if (scanningState === "slow-scanning") {
    animationClass = "construction-animation-slow"
  } else if (scanningState === "completed") {
    animationClass = "confetti-animation"
  }

  // Always show the border when a scan is in progress, paused, or completed
  const showBorder = scanningState !== "idle"

  // Determine status indicator color and text
  let statusIndicatorBg = "bg-[hsl(var(--color-success-green-bg))] dark:bg-[hsl(var(--color-success-green-bg-dark))]"
  let statusIndicatorText = "text-[hsl(var(--color-success-green-fg))] dark:text-[hsl(var(--color-success-green-fg))]"
  let statusIndicatorIcon = <Zap className="h-4 w-4 mr-1" />
  let statusText = "Escaneo para Duplicados y Archivos Gigantes en progreso"

  if (scanningState === "paused") {
    statusIndicatorBg = "bg-[hsl(var(--color-destructive-bg))] dark:bg-[hsl(var(--color-destructive-bg-dark))]"
    statusIndicatorText = "text-[hsl(var(--color-destructive-fg))] dark:text-[hsl(var(--color-destructive-fg-dark))]"
    statusIndicatorIcon = <Pause className="h-4 w-4 mr-1" />
    statusText = "Escaneo Pausado"
  } else if (scanningState === "slow-scanning") {
    statusIndicatorBg = "bg-[hsl(var(--color-organize-purple-bg))] dark:bg-[hsl(var(--color-organize-purple-bg-dark))]"
    statusIndicatorText = "text-[hsl(var(--color-organize-purple-fg))] dark:text-[hsl(var(--color-organize-purple-fg-dark))]"
    statusIndicatorIcon = <HardDrive className="h-4 w-4 mr-1" />
    statusText = "Escaneo para Ordenar Discos en progreso"
  } else if (scanningState === "completed") {
    statusIndicatorBg = "bg-[hsl(var(--muted))] dark:bg-[hsl(var(--muted))]"
    statusIndicatorText = "text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]"
    statusIndicatorIcon = <Check className="h-4 w-4 mr-1" />
    statusText = "Escaneo Terminado"
  } else if (disksWithFullScanComplete.length === disks.length) {
    statusIndicatorBg = "bg-[hsl(var(--color-organize-purple-bg))] dark:bg-[hsl(var(--color-organize-purple-bg-dark))]"
    statusIndicatorText = "text-[hsl(var(--color-organize-purple-fg))] dark:text-[hsl(var(--color-organize-purple-fg-dark))]"
    statusIndicatorIcon = <Check className="h-4 w-4 mr-1" />
    statusText = "Todos los escaneos completados"
  }

  // Debug logging
  console.log(
    "Scanning disks:",
    disks.filter((d) => d.status === "scanning" && !d.isPaused),
  )
  console.log("Animation class:", animationClass)
  console.log("Show border:", showBorder)

  return (
    <div
      className={`mb-6 rounded-lg ${
        showBorder ? animationClass : "border-3 border-[hsl(var(--border))]"
      } bg-[hsl(var(--card))] shadow-md relative status-message-box dark:bg-[hsl(var(--card))] dark:border-[hsl(var(--border))]`}
      style={{
        // Force the animation to be visible with inline styles if needed
        ...(showBorder && {
          position: "relative",
          zIndex: 1,
        }),
      }}
    >
      <div className="p-5 flex items-start">
        <div className="bg-[hsl(var(--background))] p-3 rounded-full mr-4 flex-shrink-0 shadow-sm dark:bg-[hsl(var(--muted))]" >{icon}</div>
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]" >Análisis de los Discos</h3>
            {/* Status indicator positioned closer to the label */}
            {scanningState !== "idle" || disksWithFullScanComplete.length === disks.length ? (
              <span
                className={`text-sm ${statusIndicatorBg} ${statusIndicatorText} px-3 py-1 rounded-full font-normal flex items-center ml-3 dark:bg-opacity-20`}
              >
                {statusIndicatorIcon}
                {statusText}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]" >{message}</p>
        </div>
      </div>

      {/* Construction-themed decorative elements */}
      {showBorder && scanningState !== "completed" && (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div
            className={`construction-corner ${scanningState === "slow-scanning" ? "construction-corner-purple" : scanningState === "paused" ? "construction-corner-red" : ""}`}
          ></div>
        </div>
      )}
    </div>
  )
}
