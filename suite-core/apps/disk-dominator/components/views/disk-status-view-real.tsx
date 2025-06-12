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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DiskStatusViewReal() {
  const { disks, loading, error, scanProgress, scanningDisks, startScan, formatBytes } = useRealDiskData()
  const [excludePatterns, setExcludePatterns] = useState("")

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
          const isScanning = scanningDisks.has(disk.mount_point)
          const progress = scanProgress.get(disk.mount_point)
          const usagePercent = (disk.used_space / disk.total_space) * 100

          return (
            <Card key={disk.mount_point} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    {disk.name}
                  </CardTitle>
                  {isScanning && (
                    <Badge variant="outline" className="bg-blue-50">
                      Scanning...
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
                {isScanning && progress && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {progress.processed_files} / {progress.total_files} files
                      </span>
                    </div>
                    <Progress 
                      value={progress.total_files > 0 
                        ? (progress.processed_files / progress.total_files) * 100 
                        : 0
                      } 
                      className="h-2" 
                    />
                    <div className="text-xs text-muted-foreground truncate">
                      {progress.current_path}
                    </div>
                    {progress.errors.length > 0 && (
                      <div className="text-xs text-red-500">
                        {progress.errors.length} error{progress.errors.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}

                {/* Scan buttons */}
                <div className="flex gap-2 pt-2">
                  {!isScanning ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startScan(disk.mount_point, 'Quick')}
                        className="flex-1"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Quick Scan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startScan(disk.mount_point, 'Deep')}
                        className="flex-1"
                      >
                        <FolderMinus className="h-4 w-4 mr-1" />
                        Deep Scan
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      Scanning...
                    </Button>
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