import React from "react";
import React from "react";
import React from "react";
import React from "react";
"use client"

import { useEffect } from "react"

export default function ColorFilters() {
  useEffect(() => {
    // Create the SVG element for filters with a specific ID
    const svgFilters = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svgFilters.setAttribute("class", "svg-filters")
    svgFilters.setAttribute("aria-hidden", "true")
    svgFilters.setAttribute("focusable", "false")
    svgFilters.setAttribute("id", "color-blindness-filters") // Add a specific ID

    // Add the filter definitions
    svgFilters.innerHTML = `
      <defs>
        <filter id="protanopia-filter">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0.567, 0.433, 0,     0, 0
                    0.558, 0.442, 0,     0, 0
                    0,     0.242, 0.758, 0, 0
                    0,     0,     0,     1, 0"/>
        </filter>
        
        <filter id="deuteranopia-filter">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0.625, 0.375, 0,   0, 0
                    0.7,   0.3,   0,   0, 0
                    0,     0.3,   0.7, 0, 0
                    0,     0,     0,   1, 0"/>
        </filter>
        
        <filter id="tritanopia-filter">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0.95, 0.05,  0,     0, 0
                    0,    0.433, 0.567, 0, 0
                    0,    0.475, 0.525, 0, 0
                    0,    0,     0,     1, 0"/>
        </filter>
      </defs>
    `

    // Remove any existing filters first to avoid duplicates
    const existingFilters = document.getElementById("color-blindness-filters")
    if (existingFilters) {
      existingFilters.remove()
    }

    // Add the filters to the body
    document.body.appendChild(svgFilters)

    // Clean up when unmounting
    return () => {
      const filtersToRemove = document.getElementById("color-blindness-filters")
      if (filtersToRemove) {
        document.body.removeChild(filtersToRemove)
      }
    }
  }, [])

  return null
}
