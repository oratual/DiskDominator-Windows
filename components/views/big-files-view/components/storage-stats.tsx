"use client"

import { ChevronDown } from "lucide-react"
import type { StorageStats } from "../types"
import { calculatePercentage, formatSize, getPercentageColor } from "../utils"

interface StorageStatsProps {
  storageStats: StorageStats
  showStats: boolean
  setShowStats: (show: boolean) => void
  activeDisk: string
  setActiveDisk: (disk: string) => void
}

export function StorageStatsComponent({
  storageStats,
  showStats,
  setShowStats,
  activeDisk,
  setActiveDisk,
}: StorageStatsProps) {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 shadow-sm cursor-pointer"
        onClick={() => setShowStats(!showStats)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-sm font-medium">Espacio ocupado</h3>
          </div>
          <div className="flex items-center">
            <span className="text-lg font-bold text-blue-700 dark:text-blue-400 mr-2">
              {formatSize(storageStats.largeFilesSpace)}
            </span>
            <ChevronDown
              size={20}
              className={`text-blue-500 transition-transform ${showStats ? "transform rotate-180" : ""}`}
            />
          </div>
        </div>
      </div>
      {/* Add height transition with fixed height values */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showStats ? "max-h-[500px] opacity-100 mt-0" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-t-0 rounded-b-lg p-4">
          <div className="space-y-2 text-sm dark:text-gray-300">
            <div className="flex justify-between items-center">
              <span>Archivos grandes:</span>
              <span className="font-medium">5</span>
            </div>
            <div className="flex justify-between items-center">
              <span>% del espacio usado:</span>
              <span className="font-medium">
                {Math.round((storageStats.largeFilesSpace / storageStats.usedSpace) * 100)}%
              </span>
            </div>
          </div>

          {/* Disk Space Visualization - More compact layout */}
          <div className="mt-3">
            <h3 className="text-xs font-medium mb-1.5">Distribución por disco</h3>
            {/* Changed to 2-column grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {Object.entries(storageStats.diskUsage).map(([drive, data]) => {
                const usedPercentage = calculatePercentage(data.used, data.total)
                const largeFilesPercentage = calculatePercentage(data.largeFiles, data.total)
                return (
                  <div
                    key={drive}
                    className={`${activeDisk === drive ? "opacity-100" : "opacity-70 hover:opacity-100"} cursor-pointer`}
                    onClick={() => setActiveDisk(activeDisk === drive ? "all" : drive)}
                  >
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="font-medium">{drive}</span>
                      <span className="text-xs">{largeFilesPercentage}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getPercentageColor(usedPercentage)}`}
                          style={{ width: `${usedPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs whitespace-nowrap">{formatSize(data.largeFiles)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
