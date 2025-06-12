"use client"
import React from "react";
import { Zap, HardDrive, AlertCircle } from "lucide-react"
import { FEATURE_COLORS } from "../types"

interface ScanTypesInfoProps {
  onShowExcludeModal: () => void
}

export function ScanTypesInfo({ onShowExcludeModal }: ScanTypesInfoProps) {
  return (
    <div className="bg-[hsl(var(--info-bg-light))] p-4 rounded-lg mb-6 border border-[hsl(var(--info-border-light))] dark:bg-[hsl(var(--card))] dark:border-[hsl(var(--border))]" >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left section - Scan Types */}
        <div>
          <h3 className="font-medium text-[hsl(var(--info-fg-light))] mb-2 dark:text-[hsl(var(--info-fg-dark))]" >Tipos de Escaneo</h3>
          <div className="space-y-4">
            <div className="flex">
              <div className={`bg-[hsl(var(--color-success-green-bg))] p-2 rounded-full h-min dark:bg-[hsl(var(--color-success-green-bg-dark))]`}>
                <Zap className={`h-5 w-5 text-[hsl(var(--color-success-green))] dark:text-[hsl(var(--color-success-green-fg))]`} />
              </div>
              <div className="ml-3">
                <h4 className={`font-medium text-[hsl(var(--color-success-green-fg))] dark:text-[hsl(var(--color-success-green-fg))]`}>
                  Escaneo para Duplicados y Archivos Gigantes
                </h4>
                <p className={`text-sm text-[hsl(var(--color-success-green-fg-muted))] max-w-md dark:text-[hsl(var(--color-success-green-fg-muted-dark))]`}>
                  Habilita en pocos minutos el uso de las pestañas Duplicados y Archivos gigantes
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="bg-[hsl(var(--color-organize-purple-bg))] p-2 rounded-full h-min dark:bg-[hsl(var(--color-organize-purple-bg-dark))]" >
                <HardDrive className="h-5 w-5 text-[hsl(var(--color-organize-purple))] dark:text-[hsl(var(--color-organize-purple-fg-dark))]" />
              </div>
              <div className="ml-3">
                <h4 className="font-medium text-[hsl(var(--color-organize-purple-fg))] dark:text-[hsl(var(--color-organize-purple-fg-dark))]" >Escaneo para Ordenar Discos</h4>
                <p className="text-sm text-[hsl(var(--color-organize-purple-fg-muted))] max-w-md dark:text-[hsl(var(--color-organize-purple-fg-muted-dark))]" >
                  Habilita La pestaña Ordenar Disco, se ejecuta automáticamente después del primer escaneo. Puede llegar
                  a tardar horas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right section - Skip Scan */}
        <div>
          <h3 className="font-medium text-[hsl(var(--info-fg-light))] mb-2 dark:text-[hsl(var(--info-fg-dark))]" >Privacidad y Control</h3>
          <div className="flex">
            <div className="bg-[hsl(var(--warning-bg-light))] p-2 rounded-full h-min dark:bg-[hsl(var(--warning-bg-dark))]" >
              <AlertCircle className="h-5 w-5 text-[hsl(var(--color-star-yellow))] dark:text-[hsl(var(--warning-fg-dark))]" />
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <h4 className="font-medium text-[hsl(var(--warning-fg-light))] dark:text-[hsl(var(--warning-fg-dark))]" >Omitir del escaneo</h4>
                <button
                  className="ml-2 px-3 py-1 text-xs bg-[hsl(var(--color-star-yellow))] text-[hsl(var(--primary-foreground))] rounded-full hover:bg-[hsl(var(--color-star-yellow))] transition-colors dark:bg-[hsl(var(--color-star-yellow))] dark:hover:bg-[hsl(var(--color-star-yellow))]"
                  onClick={onShowExcludeModal}
                >
                  Configurar
                </button>
              </div>
              <p className="text-sm text-[hsl(var(--warning-fg-muted-light))] max-w-md mt-1 dark:text-[hsl(var(--warning-fg-muted-dark))]" >
                Indica qué discos o carpetas no quieres que sean escaneados. En ningún caso la IA tendrá acceso al
                contenido de tus archivos, solo a tu{" "}
                <span
                  className="underline cursor-pointer relative group"
                  onClick={(e) => {
                    const tooltip = e.currentTarget.querySelector(".metadata-tooltip")
                    if (tooltip) {
                      tooltip.classList.toggle("hidden")
                    }
                  }}
                >
                  metadata
                  <span className="metadata-tooltip hidden absolute bottom-full left-1/2 transform -translate-x-1/2 w-64 bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))] text-xs rounded p-2 mb-1 z-10">
                    La metadata incluye información como nombres de archivos, tamaños, fechas de creación y
                    modificación, pero no el contenido real de los archivos.
                    <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[hsl(var(--popover))]" ></span>
                  </span>
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
