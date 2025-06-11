import React from "react";
import React from "react";
import React from "react";
"use client"

import type React from "react"

import { useRef } from "react"
import { thumbPositionToSize } from "../utils"

interface FileSizeSliderProps {
  minSizeThumb: number
  maxSizeThumb: number
  setMinSizeThumb: (value: number) => void
  setMaxSizeThumb: (value: number) => void
}

export function FileSizeSlider({ minSizeThumb, maxSizeThumb, setMinSizeThumb, setMaxSizeThumb }: FileSizeSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null)

  const handleMinThumbDrag = (e: React.MouseEvent | MouseEvent) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const newPosition = Math.max(0, Math.min(maxSizeThumb - 5, ((e.clientX - rect.left) / rect.width) * 100))
    setMinSizeThumb(newPosition)
  }

  const handleMaxThumbDrag = (e: React.MouseEvent | MouseEvent) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const newPosition = Math.min(100, Math.max(minSizeThumb + 5, ((e.clientX - rect.left) / rect.width) * 100))
    setMaxSizeThumb(newPosition)
  }

  const handleSliderClick = (e: React.MouseEvent) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const clickPosition = ((e.clientX - rect.left) / rect.width) * 100

    // Determinar qué thumb mover basado en la distancia
    if (Math.abs(clickPosition - minSizeThumb) < Math.abs(clickPosition - maxSizeThumb)) {
      setMinSizeThumb(Math.min(maxSizeThumb - 5, clickPosition))
    } else {
      setMaxSizeThumb(Math.max(minSizeThumb + 5, clickPosition))
    }
  }

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Tamaño mínimo y máximo</h3>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
          {thumbPositionToSize(minSizeThumb)} - {thumbPositionToSize(maxSizeThumb)}
        </span>
      </div>
      <div className="mt-6 relative">
        {/* Dual point range slider (interactive) */}
        <div
          ref={sliderRef}
          className="w-full h-2 bg-gray-200 rounded-lg relative cursor-pointer"
          onClick={handleSliderClick}
        >
          {/* Blue selected range */}
          <div
            className="absolute h-2 bg-blue-500 rounded-lg"
            style={{
              left: `${minSizeThumb}%`,
              width: `${maxSizeThumb - minSizeThumb}%`,
            }}
          ></div>

          {/* Left thumb - min size */}
          <div
            className="absolute w-5 h-5 bg-blue-600 rounded-full shadow border-2 border-white -ml-2.5 top-1/2 transform -translate-y-1/2 hover:scale-110 transition cursor-grab active:cursor-grabbing"
            style={{ left: `${minSizeThumb}%` }}
            onMouseDown={(e) => {
              e.preventDefault()
              const handleMouseMove = (moveEvent: MouseEvent) => {
                handleMinThumbDrag(moveEvent)
              }
              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove)
                document.removeEventListener("mouseup", handleMouseUp)
              }
              document.addEventListener("mousemove", handleMouseMove)
              document.addEventListener("mouseup", handleMouseUp)
            }}
          ></div>

          {/* Right thumb - max size */}
          <div
            className="absolute w-5 h-5 bg-blue-600 rounded-full shadow border-2 border-white -mr-2.5 top-1/2 transform -translate-y-1/2 hover:scale-110 transition cursor-grab active:cursor-grabbing"
            style={{ left: `${maxSizeThumb}%` }}
            onMouseDown={(e) => {
              e.preventDefault()
              const handleMouseMove = (moveEvent: MouseEvent) => {
                handleMaxThumbDrag(moveEvent)
              }
              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove)
                document.removeEventListener("mouseup", handleMouseUp)
              }
              document.addEventListener("mousemove", handleMouseMove)
              document.addEventListener("mouseup", handleMouseUp)
            }}
          ></div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10 MB</span>
          <span>100 MB</span>
          <span>1 GB</span>
          <span>10 GB</span>
          <span>100 GB</span>
          <span>1 TB</span>
        </div>
      </div>
    </div>
  )
}
