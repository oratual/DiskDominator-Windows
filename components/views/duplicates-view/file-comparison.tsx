"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Image, 
  FileText, 
  Film, 
  Music, 
  File,
  Calendar,
  HardDrive,
  Hash,
  Layers,
  Eye,
  Check,
  X,
  Star
} from "lucide-react"
import { formatSize } from "@/lib/utils"
import type { DuplicateItem } from "@/lib/duplicate-detection"

interface FileComparisonProps {
  items: DuplicateItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onKeepSelection: (itemId: string) => void
}

export function FileComparison({ 
  items, 
  open, 
  onOpenChange,
  onKeepSelection 
}: FileComparisonProps) {
  const [selectedTab, setSelectedTab] = useState("details")
  const [selectedItemId, setSelectedItemId] = useState<string>(
    items.find(item => item.shouldKeep)?.id || items[0]?.id || ""
  )

  // Group items by similar attributes
  const getFileType = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() || ''
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image'
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv'].includes(ext)) return 'video'
    if (['mp3', 'wav', 'flac', 'aac', 'm4a'].includes(ext)) return 'audio'
    if (['doc', 'docx', 'pdf', 'txt', 'odt'].includes(ext)) return 'document'
    return 'other'
  }

  const fileType = getFileType(items[0]?.path || '')
  
  const getFileIcon = () => {
    switch (fileType) {
      case 'image': return <Image className="text-purple-500" size={24} />
      case 'video': return <Film className="text-red-500" size={24} />
      case 'audio': return <Music className="text-blue-500" size={24} />
      case 'document': return <FileText className="text-green-500" size={24} />
      default: return <File className="text-gray-500" size={24} />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getFileIcon()}
            <span>Comparar archivos duplicados</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="preview">Vista previa</TabsTrigger>
            <TabsTrigger value="metadata">Metadatos</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {items.map(item => (
                <div 
                  key={item.id}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    item.shouldKeep 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                      : selectedItemId === item.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                  onClick={() => setSelectedItemId(item.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {item.shouldKeep ? (
                        <Badge variant="default" className="bg-green-600">
                          <Star className="mr-1" size={12} />
                          Conservar
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Duplicado
                        </Badge>
                      )}
                      {item.isOriginal && (
                        <Badge variant="secondary">
                          Original
                        </Badge>
                      )}
                    </div>
                    {!item.shouldKeep && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          onKeepSelection(item.id)
                        }}
                      >
                        <Check className="mr-1" size={14} />
                        Elegir esta
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <HardDrive className="text-muted-foreground mt-0.5" size={16} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Ubicación</p>
                        <p className="text-xs text-muted-foreground break-all">
                          {item.path}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Layers className="text-muted-foreground" size={16} />
                        <div>
                          <p className="text-xs text-muted-foreground">Tamaño</p>
                          <p className="text-sm font-medium">{formatSize(item.size)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="text-muted-foreground" size={16} />
                        <div>
                          <p className="text-xs text-muted-foreground">Modificado</p>
                          <p className="text-sm font-medium">
                            {item.modified.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Creado: {item.created.toLocaleDateString()}
                        </span>
                        <span className="font-medium">
                          Disco {item.disk}:
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick comparison summary */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Hash className="mr-2" size={16} />
                Resumen de comparación
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Archivos idénticos</p>
                  <p className="font-medium">{items.length} copias</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tamaño total</p>
                  <p className="font-medium">
                    {formatSize(items.reduce((sum, item) => sum + item.size, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Espacio recuperable</p>
                  <p className="font-medium text-green-600">
                    {formatSize(
                      items
                        .filter(item => !item.shouldKeep)
                        .reduce((sum, item) => sum + item.size, 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Archivo más antiguo</p>
                  <p className="font-medium">
                    {new Date(
                      Math.min(...items.map(item => item.created.getTime()))
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="text-center p-8">
              <Eye className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">
                Vista previa disponible en la versión con backend
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Aquí se mostrará una vista previa del archivo seleccionado
              </p>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{item.path.split('/').pop()}</h4>
                    {item.metadata ? (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(item.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="ml-2 font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No hay metadatos adicionales disponibles
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={() => {
            // Apply keep selection
            onOpenChange(false)
          }}>
            Aplicar selección
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}