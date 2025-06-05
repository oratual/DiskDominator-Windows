"use client"

import { useState } from "react"
import { applyColorFilter, type ColorFilterType } from "./color-filter-manager"

export default function ColorFilterTest() {
  const [activeFilter, setActiveFilter] = useState<ColorFilterType>("none")

  const handleFilterChange = (filter: ColorFilterType) => {
    setActiveFilter(filter)
    applyColorFilter(filter)
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Color Filter Test</h2>

      <div className="grid grid-cols-5 gap-2 mb-6">
        {["none", "grayscale", "protanopia", "deuteranopia", "tritanopia"].map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter as ColorFilterType)}
            className={`px-3 py-2 text-sm rounded-md ${
              activeFilter === filter
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-medium">Test Colors</h3>

        <div className="grid grid-cols-6 gap-2">
          <div className="h-10 bg-red-500 rounded-md" title="Red"></div>
          <div className="h-10 bg-green-500 rounded-md" title="Green"></div>
          <div className="h-10 bg-blue-500 rounded-md" title="Blue"></div>
          <div className="h-10 bg-yellow-500 rounded-md" title="Yellow"></div>
          <div className="h-10 bg-purple-500 rounded-md" title="Purple"></div>
          <div className="h-10 bg-orange-500 rounded-md" title="Orange"></div>
        </div>

        <div className="p-3 border rounded-md">
          <p className="mb-2">
            Sample text with <span className="text-red-600">red</span>, <span className="text-green-600">green</span>,
            and <span className="text-blue-600">blue</span> colors.
          </p>
          <p className="mb-2">
            Sample text with <span className="text-yellow-600">yellow</span>,{" "}
            <span className="text-purple-600">purple</span>, and <span className="text-orange-600">orange</span> colors.
          </p>
        </div>
      </div>
    </div>
  )
}
