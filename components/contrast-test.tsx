"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { applyContrast } from "./contrast-manager"

export default function ContrastTest() {
  const [currentContrast, setCurrentContrast] = useState<"normal" | "high">("normal")

  const toggleContrast = () => {
    const newContrast = currentContrast === "normal" ? "high" : "normal"
    setCurrentContrast(newContrast)
    applyContrast(newContrast)
  }

  return (
    <div className="fixed bottom-20 right-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50">
      <h3 className="text-sm font-medium mb-2">Contrast Test</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-primary text-primary-foreground rounded">Primary</div>
          <div className="p-2 bg-secondary text-secondary-foreground rounded">Secondary</div>
          <div className="p-2 bg-accent text-accent-foreground rounded">Accent</div>
          <div className="p-2 bg-muted text-muted-foreground rounded">Muted</div>
        </div>
        <Button onClick={toggleContrast} className="w-full">
          Toggle Contrast: {currentContrast}
        </Button>
      </div>
    </div>
  )
}
