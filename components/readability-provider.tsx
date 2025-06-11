import React from "react";
"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type FontFamily = "default" | "serif" | "mono" | "dyslexic"
type TextSize = "small" | "normal" | "large"
type ContrastLevel = "normal" | "high"
type SpacingLevel = "normal" | "wide"
type LineHeight = "normal" | "relaxed" | "loose"
type TextAlign = "left" | "center" | "right"
type ColorFilter = "none" | "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia"

interface ReadabilityContextType {
  fontFamily: FontFamily
  setFontFamily: (value: FontFamily) => void
  textSize: TextSize
  setTextSize: (value: TextSize) => void
  contrast: ContrastLevel
  setContrast: (value: ContrastLevel) => void
  spacing: SpacingLevel
  setSpacing: (value: SpacingLevel) => void
  lineHeight: LineHeight
  setLineHeight: (value: LineHeight) => void
  textAlign: TextAlign
  setTextAlign: (value: TextAlign) => void
  colorFilter: ColorFilter
  setColorFilter: (value: ColorFilter) => void
}

const ReadabilityContext = createContext<ReadabilityContextType | undefined>(undefined)

export function useReadability() {
  const context = useContext(ReadabilityContext)
  if (context === undefined) {
    throw new Error("useReadability must be used within a ReadabilityProvider")
  }
  return context
}

export function ReadabilityProvider({ children }: { children: React.ReactNode }) {
  const [fontFamily, setFontFamily] = useState<FontFamily>("default")
  const [textSize, setTextSize] = useState<TextSize>("normal")
  const [contrast, setContrast] = useState<ContrastLevel>("normal")
  const [spacing, setSpacing] = useState<SpacingLevel>("normal")
  const [lineHeight, setLineHeight] = useState<LineHeight>("normal")
  const [textAlign, setTextAlign] = useState<TextAlign>("left")
  const [colorFilter, setColorFilter] = useState<ColorFilter>("none")

  useEffect(() => {
    document.documentElement.dataset.fontFamily = fontFamily
    document.documentElement.dataset.textSize = textSize
    document.documentElement.dataset.contrast = contrast
    document.documentElement.dataset.spacing = spacing
    document.documentElement.dataset.lineHeight = lineHeight
    document.documentElement.dataset.textAlign = textAlign
    document.documentElement.dataset.colorFilter = colorFilter
  }, [fontFamily, textSize, contrast, spacing, lineHeight, textAlign, colorFilter])

  return (
    <ReadabilityContext.Provider
      value={{
        fontFamily,
        setFontFamily,
        textSize,
        setTextSize,
        contrast,
        setContrast,
        spacing,
        setSpacing,
        lineHeight,
        setLineHeight,
        textAlign,
        setTextAlign,
        colorFilter,
        setColorFilter,
      }}
    >
      {children}
    </ReadabilityContext.Provider>
  )
}
