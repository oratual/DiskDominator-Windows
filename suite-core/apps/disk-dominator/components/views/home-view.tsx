"use client"
import React from "react";

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HardDrive, Copy, RefreshCw, ArrowRight, BarChart3, Clock, Info, FolderOpen, AlertCircle } from "lucide-react"
import { ViewLayout } from "@/components/layouts/view-layout"
import { useAIAssistant } from "@/components/providers/ai-assistant-provider"
import { useEffect } from "react"
import { useSystemOverview } from "@/hooks/useSystemOverview"
import { useRecentActivity } from "@/hooks/useRecentActivity"
import { useQuickActions } from "@/hooks/useQuickActions"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Icon mapping for dynamic icons
const iconComponents = {
  RefreshCw,
  Copy,
  HardDrive,
  FolderOpen,
};

export default function HomeView() {
  const { addMessage } = useAIAssistant()
  const { data: systemOverview, loading: overviewLoading, error: overviewError, refresh } = useSystemOverview()
  const { data: activities, loading: activitiesLoading, error: activitiesError, formatTime, getActivityIcon, getActivityColor } = useRecentActivity({ limit: 5 })
  const { quickActions, executeAction, executing } = useQuickActions()

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

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 ** 3)
    if (gb < 1000) return `${gb.toFixed(0)} GB`
    return `${(gb / 1000).toFixed(1)} TB`
  }

  const calculatePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100)
  }

  // Map activity types to icons
  const getActivityIconComponent = (type: string) => {
    const iconMap: Record<string, any> = {
      'scan_completed': <RefreshCw className="h-4 w-4" />,
      'duplicates_found': <Copy className="h-4 w-4" />,
      'disk_organized': <FolderOpen className="h-4 w-4" />,
    };
    return iconMap[type] || <Info className="h-4 w-4" />;
  };

  const handleQuickAction = async (actionId: any) => {
    try {
      await executeAction(actionId);
    } catch (error) {
      console.error('Failed to execute quick action:', error);
    }
  };

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

        {/* Error Alert */}
        {(overviewError || activitiesError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {overviewError || activitiesError}
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {quickActions.map((action) => {
            const IconComponent = iconComponents[action.icon as keyof typeof iconComponents] || RefreshCw;
            return (
              <Card 
                key={action.id}
                className={`p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 dark:bg-gray-800 dark:border-gray-700 ${
                  action.enabled ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
                }`}
                style={{ borderLeftColor: action.color }}
                onClick={() => action.enabled && handleQuickAction(action.id)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div 
                        className="p-3 rounded-full"
                        style={{ backgroundColor: `${action.color}20` }}
                      >
                        <IconComponent 
                          className="h-6 w-6" 
                          style={{ color: action.color }}
                        />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium">{action.title}</h3>
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-full p-1">
                      <ArrowRight className="h-5 w-5 text-[#00b8d4]" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    {action.description}
                  </p>
                  {action.requiresScan && !action.enabled && (
                    <p className="text-xs text-orange-600 mt-auto">
                      Requiere escaneo previo
                    </p>
                  )}
                  {executing === action.id && (
                    <p className="text-xs text-blue-600 mt-auto">
                      Ejecutando...
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
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
              
              {overviewLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : systemOverview ? (
                <div className="space-y-4">
                  {systemOverview.disks.map((disk) => {
                    const percentage = calculatePercentage(disk.used, disk.total);
                    const colorClass = percentage > 90 ? 'bg-red-500' : 
                                     percentage > 75 ? 'bg-orange-500' : 
                                     percentage > 50 ? 'bg-blue-500' : 'bg-green-500';
                    
                    return (
                      <div key={disk.id} className="flex items-center">
                        <div className="w-8 text-center font-medium">{disk.id}:</div>
                        <div className="flex-1 ml-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{formatSize(disk.used)} usado</span>
                            <span>{percentage}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colorClass} transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatSize(disk.total)} total • {formatSize(disk.free)} libre
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* System totals */}
                  {systemOverview.disks.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-gray-200 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total del sistema:</span>
                        <span className="font-medium">{formatSize(systemOverview.total_disk_space)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Espacio usado:</span>
                        <span className="font-medium">{formatSize(systemOverview.total_used_space)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Espacio libre:</span>
                        <span className="font-medium text-green-600">{formatSize(systemOverview.total_free_space)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No hay datos de disco disponibles
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => handleQuickAction('scan_disk')}
                >
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
              
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const IconComponent = getActivityIconComponent(activity.activity_type);
                    const colorClass = getActivityColor(activity.activity_type);
                    
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <div className="bg-gray-100 p-2 rounded-full">
                          <div className={colorClass}>{IconComponent}</div>
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-sm">{activity.action}</div>
                          <div className="text-sm text-gray-600">{activity.target}</div>
                          <div className="text-xs text-gray-500 mt-1">{formatTime(activity.time)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No hay actividad reciente
                </div>
              )}
              
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