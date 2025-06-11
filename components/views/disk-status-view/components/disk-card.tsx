import React from "react";
import React from "react";
import React from "react";
"use client"
import { HardDrive, Check, AlertCircle, Zap, Pause, Play } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { type DiskStatus, FEATURE_COLORS } from "../types"
import { getStatusText, getStatusColor, getScanTypeText, formatTimeRemaining } from "../utils"

interface DiskCardProps {
  disk: DiskStatus
  startScan: (diskId: string, scanType: "quick" | "slow") => void
  togglePauseScan: (diskId: string) => void
}

export function DiskCard({ disk, startScan, togglePauseScan }: DiskCardProps) {
  const getStatusIcon = (status: string, scanType: "quick" | "slow" | null = null, isPaused?: boolean) => {
    if (isPaused) {
      return <Pause className="h-5 w-5 text-[hsl(var(--color-warning-orange))] dark:text-[hsl(var(--color-warning-orange-dark))]" />
    }

    switch (status) {
      case "scanning":
        return scanType === "quick" ? (
          <Zap className={`h-5 w-5 text-[hsl(var(--color-success-green))] dark:text-[hsl(var(--color-success-green-dark))]`} />
        ) : (
          <HardDrive className={`h-5 w-5 text-[hsl(var(--color-organize-purple))] dark:text-[hsl(var(--color-organize-purple-dark))]`} />
        )
      case "complete":
        return <Check className="h-5 w-5 text-[hsl(var(--color-success-green))] dark:text-[hsl(var(--color-success-green-dark))]" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-[hsl(var(--destructive))] dark:text-[hsl(var(--destructive))]" />
      case "paused":
        return <Pause className="h-5 w-5 text-[hsl(var(--color-warning-orange))] dark:text-[hsl(var(--color-warning-orange-dark))]" />
      default:
        return <HardDrive className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
    }
  }

  const getProgressColor = (status: string, scanType: "quick" | "slow" | null = null, isPaused?: boolean): string => {
    if (isPaused) return "bg-[hsl(var(--color-warning-orange))] dark:bg-[hsl(var(--color-warning-orange-dark))]"

    switch (status) {
      case "scanning":
        return scanType === "quick" ? `bg-[hsl(var(--color-success-green))] dark:bg-[hsl(var(--color-success-green-dark))]` : `bg-[hsl(var(--color-organize-purple))] dark:bg-[hsl(var(--color-organize-purple-dark))]`
      case "complete":
        return "bg-[hsl(var(--color-success-green))] dark:bg-[hsl(var(--color-success-green-dark))]"
      case "error":
        return "bg-[hsl(var(--destructive))] dark:bg-[hsl(var(--destructive))]"
      case "paused":
        return "bg-[hsl(var(--color-warning-orange))] dark:bg-[hsl(var(--color-warning-orange-dark))]"
      default:
        return "bg-[hsl(var(--progress-background))] dark:bg-[hsl(var(--progress-background-dark))]"
    }
  }

  return (
    <div className="bg-[hsl(var(--card))] rounded-lg shadow-sm border-2 border-[hsl(var(--border))] overflow-hidden hover:shadow-md transition-shadow disk-card dark:bg-[hsl(var(--card))] dark:border-[hsl(var(--border))]" >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <HardDrive className="h-4 w-4 mr-1.5 text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]" />
            <h3 className="font-medium text-[hsl(var(--foreground))] text-sm dark:text-[hsl(var(--foreground))]" >{disk.name}</h3>
          </div>
          <div className={cn("text-xs font-medium", getStatusColor(disk.status, disk.scanType, disk.isPaused))}>
            <div className="flex items-center">
              {getStatusIcon(disk.status, disk.scanType, disk.isPaused)}
              <span className="ml-1 text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]" >{getStatusText(disk.status, disk.isPaused)}</span>
            </div>
          </div>
        </div>

        {disk.scanType && (
          <div className="mb-1.5 text-xs text-[hsl(var(--muted-foreground))] flex justify-between items-center dark:text-[hsl(var(--muted-foreground))]" >
            <span>{getScanTypeText(disk.scanType)}</span>
            {disk.status === "scanning" && (
              <span
                className={
                  disk.isPaused ? "text-[hsl(var(--color-warning-orange))] dark:text-[hsl(var(--color-warning-orange-dark))]" : "text-[hsl(var(--color-success-green))] dark:text-[hsl(var(--color-success-green-dark))]"
                }
              >
                {disk.isPaused ? "Pausado" : "En progreso"}
              </span>
            )}
          </div>
        )}

        <div className="mb-1.5">
          <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mb-0.5 dark:text-[hsl(var(--muted-foreground))]" >
            <span>Escaneo para Duplicados y Archivos Gigantes: {Math.round(disk.quickScanProgress || 0)}%</span>
            {disk.status === "pending" && (
              <span>
                {disk.used} / {disk.size}
              </span>
            )}
          </div>
          <Progress
            value={disk.quickScanProgress || 0}
            className="h-2 progress-enhanced bg-[hsl(var(--progress-background))] dark:bg-[hsl(var(--progress-background-dark))]"
            indicatorClassName={
              disk.isPaused
                ? "bg-[hsl(var(--color-warning-orange))] progress-indicator-enhanced dark:bg-[hsl(var(--color-warning-orange-dark))]"
                : `bg-[hsl(var(--color-success-green))] progress-indicator-enhanced dark:bg-[hsl(var(--color-success-green-dark))]`
            }
          />
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mb-0.5 dark:text-[hsl(var(--muted-foreground))]" >
            <span>Escaneo para Ordenar Discos: {Math.round(disk.slowScanProgress || 0)}%</span>
            {disk.status !== "pending" && (
              <span>
                {disk.used} / {disk.size}
              </span>
            )}
          </div>
          <Progress
            value={disk.slowScanProgress || 0}
            className="h-2 progress-enhanced bg-[hsl(var(--progress-background))] dark:bg-[hsl(var(--progress-background-dark))]"
            indicatorClassName={
              disk.isPaused
                ? "bg-[hsl(var(--color-warning-orange))] progress-indicator-enhanced dark:bg-[hsl(var(--color-warning-orange-dark))]"
                : "bg-[hsl(var(--color-organize-purple))] progress-indicator-enhanced dark:bg-[hsl(var(--color-organize-purple-dark))]"
            }
          />
        </div>

        {(disk.status === "scanning" || disk.status === "paused") && disk.estimatedTimeRemaining !== undefined && (
          <div
            className={`text-xs ${
              disk.isPaused
                ? "text-[hsl(var(--color-warning-orange))] dark:text-[hsl(var(--color-warning-orange-dark))]"
                : disk.scanType === "quick"
                  ? `text-[hsl(var(--color-success-green))] dark:text-[hsl(var(--color-success-green-dark))]`
                  : "text-[hsl(var(--color-organize-purple))] dark:text-[hsl(var(--color-organize-purple-dark))]"
            } mb-2 flex items-center`}
          >
            {disk.isPaused ? (
              <Pause className="h-3 w-3 mr-1 text-[hsl(var(--color-warning-orange))] dark:text-[hsl(var(--color-warning-orange-dark))]" />
            ) : disk.scanType === "quick" ? (
              <Zap className="h-3 w-3 mr-1 text-[hsl(var(--color-success-green))] dark:text-[hsl(var(--color-success-green-dark))]" />
            ) : (
              <HardDrive className="h-3 w-3 mr-1 text-[hsl(var(--color-organize-purple))] dark:text-[hsl(var(--color-organize-purple-dark))]" />
            )}
            <span>
              {disk.isPaused ? "Pausado - Reanudar para continuar" : formatTimeRemaining(disk.estimatedTimeRemaining)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                "flex items-center",
                disk.canAnalyzeDuplicates
                  ? `text-[hsl(var(--color-info-blue))] dark:text-[hsl(var(--color-info-blue-dark))]`
                  : "text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]",
              )}
            >
              <Check className="h-3 w-3 mr-0.5" />
              <span>Duplicados</span>
            </div>
            <div
              className={cn(
                "flex items-center",
                disk.canOrganize
                  ? `text-[hsl(var(--color-organize-purple))] dark:text-[hsl(var(--color-organize-purple-dark))]`
                  : "text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]",
              )}
            >
              <Check className="h-3 w-3 mr-0.5" />
              <span>Organizar</span>
            </div>
          </div>
          <div className="text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]" >{disk.free} libre</div>
        </div>

        {(disk.status === "pending" || disk.status === "error") && (
          <div className="mt-3 flex space-x-1.5">
            <button
              onClick={() => startScan(disk.id, "quick")}
              className={`flex-1 px-2 py-1 text-xs bg-[hsl(var(--color-success-green))] text-[hsl(var(--primary-foreground))] rounded hover:bg-[hsl(var(--color-success-green-fg-muted))] transition-colors dark:bg-[hsl(var(--color-success-green-dark))] dark:hover:bg-[hsl(var(--color-success-green-fg-muted-dark))]`}
            >
              Escanear
            </button>
          </div>
        )}

        {(disk.status === "scanning" || disk.status === "paused") && (
          <div className="mt-3 flex space-x-1.5">
            <button
              onClick={() => togglePauseScan(disk.id)}
              className="flex-1 px-2 py-1 text-xs bg-[hsl(var(--color-warning-orange))] hover:bg-[hsl(var(--color-warning-orange))] text-[hsl(var(--primary-foreground))] rounded transition-colors flex items-center justify-center dark:bg-[hsl(var(--color-warning-orange-dark))] dark:hover:bg-[hsl(var(--color-warning-orange-dark))]"
            >
              {disk.isPaused ? (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Reanudar
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3 mr-1 text-[hsl(var(--color-warning-orange))] dark:text-[hsl(var(--color-warning-orange-dark))]" />
                  Pausar
                </>
              )}
            </button>
          </div>
        )}

        {disk.status === "complete" && (
          <div className="mt-3 flex space-x-1.5">
            <button
              onClick={() => startScan(disk.id, "quick")}
              className="flex-1 px-2 py-1 text-xs bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded hover:bg-[hsl(var(--accent))] transition-colors dark:bg-[hsl(var(--muted))] dark:text-[hsl(var(--foreground))] dark:hover:bg-[hsl(var(--accent))]"
            >
              Volver a escanear
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
