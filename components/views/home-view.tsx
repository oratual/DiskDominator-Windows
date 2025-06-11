import React from "react";
"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HardDrive, Copy, RefreshCw, ArrowRight, BarChart3, Clock, Info } from "lucide-react"
import { ViewLayout } from "@/components/layouts/view-layout"
import { useAIAssistant } from "@/components/providers/ai-assistant-provider"
import { useEffect } from "react"

export default function HomeView() {
  const { addMessage } = useAIAssistant()

  // Initialize AI assistant with welcome messages
  useEffect(() => {
    addMessage({
      role: "assistant",
      content: "¡Bienvenido a Disk Dominator! ¿En qué puedo ayudarte hoy?",
    })
    addMessage({
      role: "assistant",
      content:
        "Puedo ayudarte a analizar tus discos, encontrar duplicados o sugerirte formas de optimizar tu almacenamiento.",
    })
  }, [])

  const recentActivity = [
    {
      id: 1,
      action: "Escaneo completado",
      target: "Disco C:",
      time: "Hace 2 horas",
      icon: <RefreshCw className="h-4 w-4 text-green-500" />,
    },
    {
      id: 2,
      action: "Duplicados encontrados",
      target: "120 archivos (4.5 GB)",
      time: "Hace 2 horas",
      icon: <Copy className="h-4 w-4 text-[#00b8d4]" />,
    },
    // Additional activity items...
  ]

  const diskStats = [
    { id: "C", used: 325, total: 500, color: "bg-[#FF4081]" },
    { id: "D", used: 750, total: 1000, color: "bg-[#00b8d4]" },
    { id: "E", used: 1200, total: 2000, color: "bg-green-500" },
    { id: "J", used: 400, total: 1000, color: "bg-purple-500" },
  ]

  const formatSize = (gb: number) => {
    if (gb < 1000) return `${gb} GB`
    return `${(gb / 1000).toFixed(1)} TB`
  }

  const calculatePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100)
  }

  return (
    <ViewLayout title="Panel de Control">
      <div className="p-4 h-full overflow-y-auto overflow-x-hidden">
        {/* Welcome Banner */}
        <Card className="mb-6 bg-blue-50 border-blue-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-4 flex items-start">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-4">
              <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-1">Bienvenido a Disk Dominator</h2>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Esta herramienta te permite analizar, optimizar y gestionar el espacio de almacenamiento de tus discos.
                Identifica archivos duplicados, localiza archivos de gran tamaño y organiza tu contenido para maximizar
                el rendimiento y espacio disponible.
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-[#FF4081] dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="bg-[#FF4081]/10 p-3 rounded-full">
                    <RefreshCw className="h-6 w-6 text-[#FF4081]" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium">Analizar Discos</h3>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-full p-1">
                  <ArrowRight className="h-5 w-5 text-[#00b8d4]" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                Realiza dos escaneos completos de tus unidades para poder, el primero, mas rápido, dura unos minutos y
                te permite usar las pestañas de Duplicados y de Archivos Gigantes.
              </p>
            </div>
          </Card>

          {/* Additional quick action cards would go here */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Disk Status */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-gray-700" />
              Estado de los Discos
            </h2>
            <Card className="p-5">
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Monitorización en tiempo real del espacio utilizado y disponible en cada unidad de almacenamiento.
                  Visualiza la capacidad y uso de tus discos para prevenir problemas de espacio.
                </p>
                <div className="bg-gray-100 rounded-full p-1 ml-4 flex-shrink-0">
                  <ArrowRight className="h-5 w-5 text-gray-500" />
                </div>
              </div>
              <div className="space-y-4">
                {diskStats.map((disk) => (
                  <div key={disk.id} className="flex items-center">
                    <div className="w-8 text-center font-medium">{disk.id}:</div>
                    <div className="flex-1 ml-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{formatSize(disk.used)} usado</span>
                        <span>{calculatePercentage(disk.used, disk.total)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${disk.color}`}
                          style={{ width: `${calculatePercentage(disk.used, disk.total)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatSize(disk.total)} total • {formatSize(disk.total - disk.used)} libre
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Button variant="outline" className="w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <HardDrive className="h-4 w-4 mr-2" />
                      Ver detalles completos
                    </div>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Button>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-gray-700" />
              Actividad Reciente
            </h2>
            <Card className="p-5">
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Registro cronológico de las operaciones realizadas en el sistema. Seguimiento de escaneos, detecciones
                  y acciones de optimización ejecutadas.
                </p>
                <div className="bg-gray-100 rounded-full p-1 ml-4 flex-shrink-0">
                  <ArrowRight className="h-5 w-5 text-gray-500" />
                </div>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="bg-gray-100 p-2 rounded-full">{activity.icon}</div>
                    <div className="ml-3">
                      <div className="font-medium text-sm">{activity.action}</div>
                      <div className="text-sm text-gray-600">{activity.target}</div>
                      <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Button variant="outline" className="w-full">
                  <div className="flex items-center justify-between w-full">
                    <span>Ver todo el historial</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ViewLayout>
  )
}
