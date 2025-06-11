import React from "react";
"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreditCard, History, LogOut, Settings, User, Eye, ChevronDown, Check, Sliders } from "lucide-react"
import { useTheme } from "next-themes"

interface UserMenuProps {
  userName: string
  userEmail: string
  credits: number
}

export default function UserMenu({ userName, userEmail, credits }: UserMenuProps) {
  const { theme, setTheme } = useTheme()
  const [readabilityMenuOpen, setReadabilityMenuOpen] = useState(false)
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Readability settings
  const [textSize, setTextSize] = useState("normal")
  const [contrast, setContrast] = useState("normal")
  const [spacing, setSpacing] = useState("normal")
  const [colorFilter, setColorFilter] = useState("none")

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      // Usar setTimeout para asegurar que el evento de clic actual termine antes de agregar el listener
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  // Function to toggle readability menu
  const toggleReadabilityMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setReadabilityMenuOpen(!readabilityMenuOpen)
  }

  // Function to toggle advanced options
  const toggleAdvancedOptions = (e: React.MouseEvent) => {
    e.stopPropagation()
    setAdvancedOptionsOpen(!advancedOptionsOpen)
  }

  // Function to apply text size
  const applyTextSize = (size: string) => {
    setTextSize(size)
    document.documentElement.setAttribute("data-text-size", size)
  }

  // Function to apply contrast
  const applyContrast = (level: string) => {
    setContrast(level)
    if (level === "high") {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }
  }

  // Function to apply spacing
  const applySpacing = (level: string) => {
    setSpacing(level)
    if (level === "wide") {
      document.documentElement.classList.add("wide-spacing")
    } else {
      document.documentElement.classList.remove("wide-spacing")
    }
  }

  // Function to apply color filter
  const applyColorFilter = (filter: string) => {
    setColorFilter(filter)

    // Remove all existing filter classes
    document.documentElement.classList.remove(
      "filter-none",
      "filter-grayscale",
      "filter-protanopia",
      "filter-deuteranopia",
      "filter-tritanopia",
    )

    // Add the selected filter class
    if (filter !== "none") {
      document.documentElement.classList.add(`filter-${filter}`)
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full p-0 overflow-hidden hover:bg-blue-700/20 focus:ring-2 focus:ring-blue-400"
            onClick={() => setDropdownOpen(true)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src="/soccer-player-portrait.png" alt={userName} className="object-cover" />
              <AvatarFallback className="bg-blue-700 text-white text-lg font-medium">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 user-menu-dropdown"
          align="end"
          forceMount
          sideOffset={4}
          style={{
            zIndex: 1000,
            position: "absolute",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          }}
        >
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Créditos: {credits}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Ajustes</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <History className="mr-2 h-4 w-4" />
              <span>Historial</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          {/* Theme selector */}
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              {theme === "light" && <Check className="mr-2 h-4 w-4" />}
              {theme !== "light" && <div className="w-4 h-4 mr-2" />}
              <span>Tema Claro</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              {theme === "dark" && <Check className="mr-2 h-4 w-4" />}
              {theme !== "dark" && <div className="w-4 h-4 mr-2" />}
              <span>Tema Oscuro</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              {theme === "system" && <Check className="mr-2 h-4 w-4" />}
              {theme !== "system" && <div className="w-4 h-4 mr-2" />}
              <span>Tema del Sistema</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          {/* Readability options */}
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={toggleReadabilityMenu} className="cursor-pointer">
              <Eye className="mr-2 h-4 w-4" />
              <span>Opciones de Legibilidad</span>
              <ChevronDown
                className={`ml-auto h-4 w-4 transition-transform duration-300 ${readabilityMenuOpen ? "rotate-180" : ""}`}
              />
            </DropdownMenuItem>

            <div
              className={`px-2 py-1.5 space-y-2 readability-menu ${readabilityMenuOpen ? "menu-expanded" : "menu-collapsed"}`}
            >
              {/* Text Size Options */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-2">Tamaño del Texto</p>
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${textSize === "small" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => applyTextSize("small")}
                  >
                    Pequeño
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${textSize === "normal" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => applyTextSize("normal")}
                  >
                    Normal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${textSize === "large" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => applyTextSize("large")}
                  >
                    Grande
                  </Button>
                </div>
              </div>

              {/* Contrast Options */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-2">Contraste</p>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${contrast === "normal" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => applyContrast("normal")}
                  >
                    Normal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${contrast === "high" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => applyContrast("high")}
                  >
                    Alto
                  </Button>
                </div>
              </div>

              {/* Spacing Options */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-2">Espaciado</p>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${spacing === "normal" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => applySpacing("normal")}
                  >
                    Normal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${spacing === "wide" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => applySpacing("wide")}
                  >
                    Amplio
                  </Button>
                </div>
              </div>

              {/* Advanced Options Button */}
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center text-xs h-8"
                  onClick={toggleAdvancedOptions}
                >
                  <Sliders className="mr-2 h-3 w-3" />
                  Avanzado
                  <ChevronDown
                    className={`ml-auto h-3 w-3 transition-transform duration-300 ${advancedOptionsOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </div>

              {/* Advanced Options (Color Filters) */}
              <div
                className={`space-y-1 pt-1 advanced-options ${advancedOptionsOpen ? "menu-expanded" : "menu-collapsed"}`}
              >
                <p className="text-xs font-medium text-muted-foreground px-2">Filtros de Color</p>
                <div className="grid grid-cols-1 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${colorFilter === "none" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => applyColorFilter("none")}
                  >
                    Sin Filtro
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${colorFilter === "grayscale" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => applyColorFilter("grayscale")}
                  >
                    Escala de Grises
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${colorFilter === "protanopia" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => applyColorFilter("protanopia")}
                  >
                    Protanopía (Rojo-Verde)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${colorFilter === "deuteranopia" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => applyColorFilter("deuteranopia")}
                  >
                    Deuteranopía (Verde)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs h-8 ${colorFilter === "tritanopia" ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => applyColorFilter("tritanopia")}
                  >
                    Tritanopía (Azul-Amarillo)
                  </Button>
                </div>
              </div>
            </div>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
