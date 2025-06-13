"use client"
import React, { useState, useEffect } from "react"
import {
  HardDrive,
  Check,
  AlertCircle,
  Zap,
  Pause,
  Play,
  X,
  FolderMinus,
  Save,
  Info,
  RefreshCw,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useRealDiskData } from "@/hooks/use-real-disk-data"
import { useScanSessions } from "@/hooks/use-scan-sessions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DiskStatusViewReal() {
  const { disks, loading, error, formatBytes } = useRealDiskData()
  const {
    sessions,
    createScanSession,
    startScanSession,
    pauseScanSession,
    resumeScanSession,
    cancelScanSession,
    getSessionStatus,
    isSessionRunning,
    isSessionPaused,
    canPauseSession,
    canResumeSession,
    formatProgress,
    formatTimeRemaining,
  } = useScanSessions()
  const [excludePatterns, setExcludePatterns] = useState("")
  const [activeSessions, setActiveSessions] = useState<Map<string, string>>(new Map()) // disk_path -> session_id

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2">Loading disk information...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-red-500">Error: {error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Disk Analysis</h2>
        <Badge variant="secondary">
          {disks.length} disk{disks.length !== 1 ? 's' : ''} detected
        </Badge>
      </div>

      {/* Exclude patterns input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Exclude Patterns (comma-separated)</label>
        <Input
          value={excludePatterns}
          onChange={(e) => setExcludePatterns(e.target.value)}
          placeholder="node_modules, .git, *.tmp"
          className="max-w-md"
        />
      </div>

      {/* Disk list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {disks.map((disk) => {
          const sessionId = activeSessions.get(disk.mount_point)
          const session = sessionId ? sessions.get(sessionId) : null
          const isScanning = session ? isSessionRunning(session) : false
          const isPaused = session ? isSessionPaused(session) : false
          const usagePercent = (disk.used_space / disk.total_space) * 100

          const startDiskScan = async (scanType: 'quick' | 'deep') => {
            const patterns = excludePatterns.split(',').map(p => p.trim()).filter(p => p.length > 0)
            const newSessionId = await createScanSession(disk.mount_point, scanType, patterns)
            if (newSessionId) {
              setActiveSessions(prev => new Map(prev).set(disk.mount_point, newSessionId))
              await startScanSession(newSessionId)
            }
          }

          const handlePause = async () => {
            if (sessionId) {
              await pauseScanSession(sessionId)
            }
          }

          const handleResume = async () => {
            if (sessionId) {
              await resumeScanSession(sessionId)
            }
          }

          const handleCancel = async () => {
            if (sessionId) {
              await cancelScanSession(sessionId)
              setActiveSessions(prev => {
                const next = new Map(prev)
                next.delete(disk.mount_point)
                return next
              })
            }
          }

          return (
            <Card key={disk.mount_point} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    {disk.name}
                  </CardTitle>
                  {session && (
                    <Badge 
                      variant="outline" 
                      className={
                        isScanning ? "bg-blue-50" : 
                        isPaused ? "bg-yellow-50" : 
                        "bg-green-50"
                      }
                    >
                      {getSessionStatus(session)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Disk usage */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Storage</span>
                    <span className="font-medium">
                      {formatBytes(disk.used_space)} / {formatBytes(disk.total_space)}
                    </span>
                  </div>
                  <Progress value={usagePercent} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(disk.available_space)} free • {disk.file_system}
                  </div>
                </div>

                {/* Scan progress */}
                {session && (isScanning || isPaused) && (
                  <div className="space-y-3 pt-2 border-t">
                    {/* Phase indicator */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phase</span>
                      <span className="font-medium capitalize">
                        {session.progress.current_phase}
                        {isPaused && " (Paused)"}
                      </span>
                    </div>

                    {/* Quick scan progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Quick Scan
                        </span>
                        <span className="font-medium">
                          {formatProgress(session.progress.quick_scan.processed_files / Math.max(session.progress.quick_scan.total_files, 1) * 100)}
                        </span>
                      </div>
                      <Progress 
                        value={session.progress.quick_scan.total_files > 0 
                          ? (session.progress.quick_scan.processed_files / session.progress.quick_scan.total_files) * 100 
                          : 0
                        } 
                        className="h-1.5" 
                      />
                    </div>

                    {/* Deep scan progress (if applicable) */}
                    {session.scan_type === 'Deep' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            Deep Scan
                          </span>
                          <span className="font-medium">
                            {formatProgress(session.progress.deep_scan.processed_files / Math.max(session.progress.deep_scan.total_files, 1) * 100)}
                          </span>
                        </div>
                        <Progress 
                          value={session.progress.deep_scan.total_files > 0 
                            ? (session.progress.deep_scan.processed_files / session.progress.deep_scan.total_files) * 100 
                            : 0
                          } 
                          className="h-1.5" 
                        />
                      </div>
                    )}

                    {/* Overall progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Overall</span>
                        <span className="font-medium">
                          {formatProgress(session.progress.overall_progress)}
                        </span>
                      </div>
                      <Progress 
                        value={session.progress.overall_progress} 
                        className="h-2" 
                      />
                    </div>

                    {/* Current file and time remaining */}
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground truncate">
                        {session.progress.current_phase === 'quick' 
                          ? session.progress.quick_scan.current_path 
                          : session.progress.deep_scan.current_path}
                      </div>
                      {session.progress.estimated_total_time > 0 && (
                        <div className="text-xs text-muted-foreground">
                          ~{formatTimeRemaining(session.progress.estimated_total_time - session.progress.elapsed_time)} remaining
                        </div>
                      )}
                    </div>

                    {/* Errors */}
                    {(session.progress.quick_scan.errors.length > 0 || session.progress.deep_scan.errors.length > 0) && (
                      <div className="text-xs text-red-500">
                        {session.progress.quick_scan.errors.length + session.progress.deep_scan.errors.length} error(s)
                      </div>
                    )}
                  </div>
                )}

                {/* Scan buttons */}
                <div className="flex gap-2 pt-2">
                  {!isScanning && !isPaused ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startDiskScan('quick')}
                        className="flex-1"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Quick Scan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startDiskScan('deep')}
                        className="flex-1"
                      >
                        <HardDrive className="h-4 w-4 mr-1" />
                        Deep Scan
                      </Button>
                    </>
                  ) : isPaused ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResume}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePause}
                        className="flex-1"
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {disks.length === 0 && (
        <div className="text-center py-12">
          <HardDrive className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No disks detected</p>
        </div>
      )}
    </div>
  )
}