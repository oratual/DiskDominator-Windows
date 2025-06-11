"use client"
import React from "react";
import { X, FolderMinus, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import FileExplorer from "@/components/file-explorer"

interface ExcludeModalProps {
  showExcludeModal: boolean
  setShowExcludeModal: (show: boolean) => void
  handleExcludeSelection: (paths: string[]) => void
  saveExclusions: () => void
}

export function ExcludeModal({
  showExcludeModal,
  setShowExcludeModal,
  handleExcludeSelection,
  saveExclusions,
}: ExcludeModalProps) {
  if (!showExcludeModal) return null

do,   return (
    <div className="fixed inset-0 bg-[hsl(var(--modal-overlay-bg))] flex items-center justify-center z-50">
      <div className="bg-[hsl(var(--card))] rounded-lg shadow-lg w-4/5 max-w-6xl h-4/5 flex flex-col dark:bg-[hsl(var(--card))]" >
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))] dark:border-[hsl(var(--border))]" >
          <div className="flex items-center">
            <FolderMinus className="h-5 w-5 mr-2 text-[hsl(var(--color-star-yellow))] dark:text-[hsl(var(--color-star-yellow))]" />
            <h3 className="text-lg font-medium text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]" >Excluir discos y carpetas del escaneo</h3>
          </div>
          <button
            onClick={() => setShowExcludeModal(false)}
            className="p-1 rounded-full hover:bg-[hsl(var(--muted))] dark:hover:bg-[hsl(var(--muted))]"
          >
            <X className="h-5 w-5 text-[hsl(var(--muted-foreground))] dark:text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>

        <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--warning-bg-light))] dark:bg-[hsl(var(--warning-bg-dark))] dark:bg-opacity-20 dark:border-[hsl(var(--border))]" >
          <p className="text-sm text-[hsl(var(--warning-fg-light))] dark:text-[hsl(var(--warning-fg-muted-dark))]" >
            Selecciona los discos y carpetas que deseas excluir del escaneo. Estos elementos no serán analizados y no
            aparecerán en los resultados.
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <FileExplorer
            initialPath="C:/"
            onSelectionChange={(items) => {
              const paths = items.map((item) => item.path)
              handleExcludeSelection(paths)
            }}
            viewModeOptions={true}
            showDriveCheckboxes={true}
          />
        </div>

        <div className="p-4 border-t border-[hsl(var(--border))] flex justify-end space-x-3 dark:border-[hsl(var(--border))]" >
          <Button
            variant="outline"
            onClick={() => setShowExcludeModal(false)}
            className="text-[hsl(var(--foreground))] border-[hsl(var(--border))] dark:text-[hsl(var(--foreground))] dark:border-[hsl(var(--border))]"
          >
            Cancelar
          </Button>
          <Button
            onClick={saveExclusions}
            className="bg-[hsl(var(--color-star-yellow))] hover:bg-[hsl(var(--color-star-yellow))] text-[hsl(var(--primary-foreground))] dark:bg-[hsl(var(--color-star-yellow))] dark:hover:bg-[hsl(var(--color-star-yellow))]"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar exclusiones
          </Button>
        </div>
      </div>
    </div>
  )
}
