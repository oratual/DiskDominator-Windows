import React from "react";
import React from "react";
"use client"
import { HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Disk {
  id: string
  label: string
  path: string
  color?: string
  usedSpace?: number
  totalSpace?: number
}

interface DiskSelectorProps {
  disks: Disk[]
  selectedDisks: string[]
  onChange: (selectedDisks: string[]) => void
  compact?: boolean
  title?: string
}

export default function DiskSelector({
  disks,
  selectedDisks,
  onChange,
  compact = false,
  title = "Discos a analizar",
}: DiskSelectorProps) {
  // Toggle disk selection
  const toggleDisk = (diskId: string) => {
    if (selectedDisks.includes(diskId)) {
      onChange(selectedDisks.filter((id) => id !== diskId))
    } else {
      onChange([...selectedDisks, diskId])
    }
  }

  // Calculate percentage used for disk usage indicator
  const getUsagePercentage = (used?: number, total?: number) => {
    if (!used || !total) return 0
    return Math.min(100, Math.round((used / total) * 100))
  }

  // Get color class based on usage percentage
  const getUsageColorClass = (percentage: number) => {
    if (percentage < 60) return "bg-green-500"
    if (percentage < 85) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="px-1 py-1">
      {" "}
      {/* Reduced padding */}
      <h3 className={cn("font-medium mb-1.5 dark:text-gray-200", compact ? "text-xs" : "text-sm")}>{title}</h3>{" "}
      {/* Reduced margin */}
      <div className="space-y-1">
        {disks.map((disk) => {
          const isSelected = selectedDisks.includes(disk.id)
          const usagePercentage = getUsagePercentage(disk.usedSpace, disk.totalSpace)
          const usageColorClass = getUsageColorClass(usagePercentage)

          return (
            <div
              key={disk.id}
              className={cn(
                "flex items-center p-1 rounded-md transition-colors", // Reduced padding
                isSelected
                  ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
              )}
            >
              <input
                type="checkbox"
                id={`disk-${disk.id}`}
                checked={isSelected}
                onChange={() => toggleDisk(disk.id)}
                className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500" // Reduced size
              />
              <label htmlFor={`disk-${disk.id}`} className="flex items-center flex-1 ml-1.5 cursor-pointer">
                {" "}
                {/* Reduced margin */}
                <HardDrive
                  size={compact ? 12 : 14} // Reduced icon size
                  className={cn("mr-1", disk.color ? `text-${disk.color}-500` : "text-gray-500")} // Reduced margin
                />
                <span className={cn("truncate dark:text-gray-200", compact ? "text-xs" : "text-xs")}>{disk.label}</span>{" "}
                {/* Always use text-xs */}
              </label>

              {/* Disk usage indicator (only if usage data is provided) */}
              {disk.usedSpace && disk.totalSpace && (
                <div className="flex items-center ml-1 space-x-1">
                  {" "}
                  {/* Added flex and reduced margin */}
                  <div className="w-10 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    {" "}
                    {/* Reduced width and height */}
                    <div className={`h-full ${usageColorClass}`} style={{ width: `${usagePercentage}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-7 text-right">{usagePercentage}%</span>{" "}
                  {/* Added percentage text */}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
