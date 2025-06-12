"use client"

import React from "react";

import { useState, useRef, useEffect } from "react"
import { CreditCard, History, LogOut, Settings, User, Eye, ChevronDown, Check, Sliders } from "lucide-react"
import { useTheme } from "next-themes"
import { applyColorFilter, type ColorFilterType } from "./color-filter-manager"
// Import the contrast manager
import { applyContrast, type ContrastLevel } from "./contrast-manager"

interface UserMenuProps {
  userName: string
  userEmail: string
  credits: number
  menuOpen: boolean
  onClose: () => void
}

export default function FixedUserMenu({ userName, userEmail, credits, menuOpen, onClose }: UserMenuProps) {
  const { theme, setTheme } = useTheme()
  const [readabilityMenuOpen, setReadabilityMenuOpen] = useState(false)
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Readability settings
  const [textSize, setTextSize] = useState("normal")
  // Update the contrast state type
  const [contrast, setContrast] = useState<ContrastLevel>("normal")
  const [spacing, setSpacing] = useState("normal")
  const [colorFilter, setColorFilter] = useState<ColorFilterType>("none")

  // Initialize settings from localStorage on component mount
  useEffect(() => {
    const savedTextSize = localStorage.getItem("textSize") || "normal"
    const savedContrast = (localStorage.getItem("contrast") as ContrastLevel) || "normal"
    const savedSpacing = localStorage.getItem("spacing") || "normal"
    const savedColorFilter = (localStorage.getItem("colorFilter") as ColorFilterType) || "none"

    setTextSize(savedTextSize)
    setContrast(savedContrast)
    setSpacing(savedSpacing)
    setColorFilter(savedColorFilter)

    // Apply saved settings
    applyTextSize(savedTextSize)
    //applyContrast(savedContrast)
    applyContrast(savedContrast)
    applySpacing(savedSpacing)
    applyColorFilter(savedColorFilter)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (menuOpen) {
      // Use setTimeout to ensure the current click event finishes before adding the listener
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuOpen, onClose])

  // Function to toggle readability menu
  const toggleReadabilityMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setReadabilityMenuOpen(!readabilityMenuOpen)
    // Don't close the main menu when toggling readability options
  }

  // Function to toggle advanced options
  const toggleAdvancedOptions = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAdvancedOptionsOpen(!advancedOptionsOpen)
    // Don't close the main menu when toggling advanced options
  }

  // Function to apply text size
  const applyTextSize = (size: string) => {
    setTextSize(size)
    localStorage.setItem("textSize", size)

    // Remove existing text size classes
    document.documentElement.classList.remove("text-small", "text-normal", "text-large")

    // Add the selected text size class
    if (size !== "normal") {
      document.documentElement.classList.add(`text-${size}`)
    }
  }

  // Replace the applyContrast function with this:
  // Function to apply contrast
  const handleContrastChange = (level: ContrastLevel) => {
    setContrast(level)
    localStorage.setItem("contrast", level)
    applyContrast(level)
  }

  // Function to apply spacing
  const applySpacing = (level: string) => {
    setSpacing(level)
    localStorage.setItem("spacing", level)

    // Apply wide spacing if selected
    if (level === "wide") {
      document.documentElement.classList.add("wide-spacing")
    } else {
      document.documentElement.classList.remove("wide-spacing")
    }
  }

  // Function to apply color filter - now using our centralized function
  const handleColorFilterChange = (filter: ColorFilterType) => {
    setColorFilter(filter)
    localStorage.setItem("colorFilter", filter)
    applyColorFilter(filter)
  }

  // Handle menu item click
  const handleMenuItemClick = (action: () => void) => {
    action()
    // Don't close the menu for theme changes or readability options
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Dropdown Menu */}
      {menuOpen && (
        <div
          className="absolute right-0 mt-2 w-60 rounded-md shadow-lg bg-popover text-popover-foreground ring-1 ring-black ring-opacity-5 user-menu-dropdown z-50"
          style={{
            animation: "fadeIn 0.2s ease-out",
            transformOrigin: "top right",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* User Info */}
          <div className="px-4 py-3">
            <p className="text-sm font-medium leading-none text-foreground">{userName}</p>
            <p className="text-sm leading-none text-muted-foreground mt-1">{userEmail}</p>
          </div>

          <div className="border-t border-border"></div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => console.log("Perfil clicked")}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </button>

            <button
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => console.log("Credits clicked")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Créditos: {credits}</span>
            </button>

            <button
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => console.log("Settings clicked")}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Ajustes</span>
            </button>

            <button
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => console.log("History clicked")}
            >
              <History className="mr-2 h-4 w-4" />
              <span>Historial</span>
            </button>
          </div>

          <div className="border-t border-border"></div>

          {/* Theme Options */}
          <div className="py-1">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleMenuItemClick(() => setTheme("light"))}
            >
              {theme === "light" && <Check className="mr-2 h-4 w-4" />}
              {theme !== "light" && <div className="w-4 h-4 mr-2" />}
              <span>Tema Claro</span>
            </button>

            <button
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleMenuItemClick(() => setTheme("dark"))}
            >
              {theme === "dark" && <Check className="mr-2 h-4 w-4" />}
              {theme !== "dark" && <div className="w-4 h-4 mr-2" />}
              <span>Tema Oscuro</span>
            </button>

            <button
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleMenuItemClick(() => setTheme("system"))}
            >
              {theme === "system" && <Check className="mr-2 h-4 w-4" />}
              {theme !== "system" && <div className="w-4 h-4 mr-2" />}
              <span>Tema del Sistema</span>
            </button>
          </div>

          <div className="border-t border-border"></div>

          {/* Readability Options */}
          <div className="py-1">
            <button
              className="flex items-center justify-between w-full px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={toggleReadabilityMenu}
            >
              <div className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                <span>Opciones de Legibilidad</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${readabilityMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Readability Submenu */}
            <div className={`px-2 py-1.5 space-y-2 ${readabilityMenuOpen ? "block" : "hidden"}`}>
              {/* Text Size Options */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground px-2">Tamaño del Texto</p>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    className={`text-sm h-8 px-2 py-1 rounded ${
                      textSize === "small"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => applyTextSize("small")}
                  >
                    Pequeño
                  </button>
                  <button
                    className={`text-sm h-8 px-2 py-1 rounded ${
                      textSize === "normal"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => applyTextSize("normal")}
                  >
                    Normal
                  </button>
                  <button
                    className={`text-sm h-8 px-2 py-1 rounded ${
                      textSize === "large"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => applyTextSize("large")}
                  >
                    Grande
                  </button>
                </div>
              </div>

              {/* Contrast Options */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground px-2">Contraste</p>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    className={`text-sm h-8 px-2 py-1 rounded ${
                      contrast === "normal"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => handleContrastChange("normal")}
                  >
                    Normal
                  </button>
                  <button
                    className={`text-sm h-8 px-2 py-1 rounded ${
                      contrast === "high"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => handleContrastChange("high")}
                  >
                    Alto
                  </button>
                </div>
              </div>

              {/* Spacing Options */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground px-2">Espaciado</p>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    className={`text-sm h-8 px-2 py-1 rounded ${
                      spacing === "normal"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => applySpacing("normal")}
                  >
                    Normal
                  </button>
                  <button
                    className={`text-sm h-8 px-2 py-1 rounded ${
                      spacing === "wide"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => applySpacing("wide")}
                  >
                    Amplio
                  </button>
                </div>
              </div>

              {/* Advanced Options Button */}
              <div className="pt-1">
                <button
                  className="flex items-center justify-between w-full px-2 py-1 text-sm rounded bg-secondary text-secondary-foreground"
                  onClick={toggleAdvancedOptions}
                >
                  <div className="flex items-center">
                    <Sliders className="mr-2 h-3 w-3" />
                    <span>Avanzado</span>
                  </div>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-300 ${advancedOptionsOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {/* Advanced Options (Color Filters) */}
              <div className={`space-y-1 pt-1 ${advancedOptionsOpen ? "block" : "hidden"}`}>
                <p className="text-sm font-medium text-muted-foreground px-2">Filtros de Color</p>
                <div className="grid grid-cols-1 gap-1">
                  <button
                    className={`text-sm h-8 px-2 py-1 rounded ${
                      colorFilter === "none"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => handleColorFilterChange("none")}
                  >
                    Sin Filtro
                  </button>
                  <button
                    className={`text-sm h-8 px-2 py-1 rounded ${
                      colorFilter === "grayscale"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => handleColorFilterChange("grayscale")}
                  >
                    Escala de Grises
                  </button>
                  <button
                    className={`text-sm h-8 px-2 py-1 rounded ${
                      colorFilter === "protanopia"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => handleColorFilterChange("protanopia")}
                  >
                    Protanopía (Rojo-Verde)
                  </button>
                  <button
                    className={`text-sm h-8 px-2 py-1 rounded ${
                      colorFilter === "deuteranopia"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => handleColorFilterChange("deuteranopia")}
                  >
                    Deuteranopía (Verde)
                  </button>
                  <button
                    className={`text-sm h-8 px-2 py-1 rounded ${
                      colorFilter === "tritanopia"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                    onClick={() => handleColorFilterChange("tritanopia")}
                  >
                    Tritanopía (Azul-Amarillo)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border"></div>

          {/* Logout */}
          <div className="py-1">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => console.log("Logout clicked")}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
