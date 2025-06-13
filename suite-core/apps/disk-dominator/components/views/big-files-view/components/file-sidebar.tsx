"use client"
import React from "react";

import { useState } from "react"
import { ChevronLeft, ChevronRight, List, Grid, ChevronDown } from "lucide-react"
import DiskSelector from "@/components/disk-selector"
import type { Disk } from "@/components/disk-selector"
import { FileSizeSlider } from "./file-size-slider"
import { StorageStatsComponent } from "./storage-stats"
import { storageStats } from "../utils"

interface FileSidebarProps {
  sidebarExpanded: boolean
  setSidebarExpanded: (expanded: boolean) => void
  selectedView: string
  setSelectedView: (view: string) => void
  selectedDisks: string[]
  setSelectedDisks: (disks: string[]) => void
  availableDisks: Array<{ name: string; used: number; total: number; percentage: number }>
  minSizeThumb: number
  maxSizeThumb: number
  setMinSizeThumb: (value: number) => void
  setMaxSizeThumb: (value: number) => void
  sortBy: string
  setSortBy: (sort: string) => void
  sortDirection: string
  setSortDirection: (direction: string) => void
}

export function FileSidebar({
  sidebarExpanded,
  setSidebarExpanded,
  selectedView,
  setSelectedView,
  selectedDisks,
  setSelectedDisks,
  availableDisks,
  minSizeThumb,
  maxSizeThumb,
  setMinSizeThumb,
  setMaxSizeThumb,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
}: FileSidebarProps) {
  const [showStats, setShowStats] = useState(true)
  const [activeDisk, setActiveDisk] = useState("all")

  return (
    <>
      {!sidebarExpanded ? (
        <div
          className="flex flex-col h-full w-10 bg-gray-800 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 cursor-pointer"
          onClick={() => setSidebarExpanded(true)}
        >
          {/* Top arrow */}
          <div className="h-10 flex items-center justify-center border-b border-gray-300 dark:border-gray-700">
            <ChevronRight size={16} className="text-gray-500" />
          </div>

          {/* Vertical title */}
          <div className="flex-1 flex items-center justify-center">
            <span
              className="text-sm font-medium text-gray-500 dark:text-gray-400 transform -rotate-90 whitespace-nowrap"
              style={{ transformOrigin: "center center" }}
            >
              Archivos Gigantes
            </span>
          </div>

          {/* Bottom line to match other sections */}
          <div className="h-px bg-gray-300 dark:bg-gray-700 w-full"></div>
        </div>
      ) : (
        // Keep the expanded state as is, but ensure it has the proper header with arrow
        <div className="flex flex-col h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          {/* Header with collapse button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium">Archivos Gigantes</h3>
            <button
              onClick={() => setSidebarExpanded(false)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Rest of the component remains unchanged */}
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Selector de discos - moved to the top */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <DiskSelector
                title="Discos Seleccionados"
                disks={availableDisks.map(disk => ({ 
                  name: disk.name, 
                  letter: disk.name, 
                  used: disk.used, 
                  total: disk.total, 
                  percentage: disk.percentage 
                }))}
                selectedDisks={selectedDisks}
                onChange={setSelectedDisks}
                compact={!sidebarExpanded}
              />
            </div>

            {/* Storage Stats Component */}
            <StorageStatsComponent
              storageStats={storageStats}
              showStats={showStats}
              setShowStats={setShowStats}
              activeDisk={activeDisk}
              setActiveDisk={setActiveDisk}
            />

            {/* File Size Slider Component */}
            <FileSizeSlider
              minSizeThumb={minSizeThumb}
              maxSizeThumb={maxSizeThumb}
              setMinSizeThumb={setMinSizeThumb}
              setMaxSizeThumb={setMaxSizeThumb}
            />

            {/* View options */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Vista</h3>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
                  <button
                    className={`p-1 rounded ${selectedView === "list" ? "bg-white dark:bg-gray-600 shadow-sm" : ""}`}
                    onClick={() => setSelectedView("list")}
                  >
                    <List size={16} />
                  </button>
                  <button
                    className={`p-1 rounded ${selectedView === "explorer" ? "bg-white dark:bg-gray-600 shadow-sm" : ""}`}
                    onClick={() => setSelectedView("explorer")}
                  >
                    <Grid size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sorting options */}
            <div className="p-4 border-t border-gray-200 mt-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-gray-500">Ordenar por</h3>
                <select
                  className="text-xs border rounded p-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="size">Tamaño</option>
                  <option value="date">Fecha</option>
                  <option value="name">Nombre</option>
                </select>
              </div>
              <button
                className="text-xs flex items-center justify-center w-full border border-gray-300 rounded p-1 mt-2 hover:bg-gray-50"
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
              >
                {sortDirection === "asc" ? (
                  <span className="flex items-center">
                    <ChevronDown size={14} className="mr-1" /> Descendente
                  </span>
                ) : (
                  <span className="flex items-center">
                    <ChevronRight size={14} className="mr-1" /> Ascendente
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
