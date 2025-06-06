"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { FileComparison } from "./file-comparison"
import { 
  detectDuplicates, 
  calculateSavings, 
  deleteDuplicates,
  moveToRecycleBin,
  type DuplicateGroup,
  type DuplicateItem,
  type DuplicateScanOptions
} from "@/lib/duplicate-detection"
import {
  Trash2,
  Star,
  Folder,
  File,
  Image,
  Video,
  FileText,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Shield,
  Zap
} from "lucide-react"
import { formatSize } from "@/lib/utils"

interface EnhancedDuplicatesProps {
  selectedDisks: string[]
  onDiskChange: (disks: string[]) => void
}

export function EnhancedDuplicates({ selectedDisks, onDiskChange }: EnhancedDuplicatesProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)
  const [comparisonGroup, setComparisonGroup] = useState<DuplicateGroup | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const { toast } = useToast()

  // Scan options
  const [scanOptions, setScanOptions] = useState<DuplicateScanOptions>({
    disks: selectedDisks,
    method: 'hash',
    groupBy: 'hash',
    minSize: 1024 * 1024, // 1MB minimum
    includeHidden: false,
    includeSystem: false
  })

  // Start duplicate scan
  const startScan = useCallback(async () => {
    setIsScanning(true)
    setScanProgress(0)
    setDuplicateGroups([])
    setSelectedItems(new Set())

    // Simulate progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const groups = await detectDuplicates({
        ...scanOptions,
        disks: selectedDisks
      })
      
      setDuplicateGroups(groups)
      setScanProgress(100)
      setLastScanTime(new Date())

      // Auto-select items to delete (non-originals)
      const itemsToDelete = new Set<string>()
      groups.forEach(group => {
        group.items.forEach(item => {
          if (!item.shouldKeep) {
            itemsToDelete.add(item.id)
          }
        })
      })
      setSelectedItems(itemsToDelete)

      toast({
        title: "Análisis completado",
        description: `Se encontraron ${groups.length} grupos de duplicados`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error en el análisis",
        description: "No se pudo completar el análisis de duplicados",
      })
    } finally {
      clearInterval(progressInterval)
      setIsScanning(false)
      setScanProgress(0)
    }
  }, [selectedDisks, scanOptions, toast])

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Select all items in a group
  const selectAllInGroup = (group: DuplicateGroup, select: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      group.items.forEach(item => {
        if (!item.shouldKeep) {
          if (select) {
            newSet.add(item.id)
          } else {
            newSet.delete(item.id)
          }
        }
      })
      return newSet
    })
  }

  // Delete selected items
  const handleDelete = async () => {
    if (selectedItems.size === 0) return

    setIsDeleting(true)
    try {
      await deleteDuplicates(Array.from(selectedItems))
      
      // Remove deleted items from groups
      setDuplicateGroups(prev => {
        return prev.map(group => ({
          ...group,
          items: group.items.filter(item => !selectedItems.has(item.id))
        })).filter(group => group.items.length >= 2)
      })

      setSelectedItems(new Set())
      
      toast({
        title: "Duplicados eliminados",
        description: `Se eliminaron ${selectedItems.size} archivos duplicados`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: "No se pudieron eliminar algunos archivos",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Move to recycle bin
  const handleMoveToRecycleBin = async () => {
    if (selectedItems.size === 0) return

    setIsDeleting(true)
    try {
      await moveToRecycleBin(Array.from(selectedItems))
      
      // Remove items from groups
      setDuplicateGroups(prev => {
        return prev.map(group => ({
          ...group,
          items: group.items.filter(item => !selectedItems.has(item.id))
        })).filter(group => group.items.length >= 2)
      })

      setSelectedItems(new Set())
      
      toast({
        title: "Movidos a la papelera",
        description: `Se movieron ${selectedItems.size} archivos a la papelera`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al mover",
        description: "No se pudieron mover algunos archivos",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Calculate savings
  const savings = calculateSavings(duplicateGroups)
  const selectedSize = Array.from(selectedItems).reduce((sum, itemId) => {
    for (const group of duplicateGroups) {
      const item = group.items.find(i => i.id === itemId)
      if (item) return sum + item.size
    }
    return sum
  }, 0)

  // Get icon for file type
  const getFileIcon = (group: DuplicateGroup) => {
    if (group.type === 'folder') return <Folder className="text-blue-500" size={20} />
    
    const mimeType = group.mimeType || ''
    if (mimeType.startsWith('image/')) return <Image className="text-purple-500" size={20} />
    if (mimeType.startsWith('video/')) return <Video className="text-red-500" size={20} />
    if (mimeType.includes('document') || mimeType.includes('text')) {
      return <FileText className="text-green-500" size={20} />
    }
    return <File className="text-gray-500" size={20} />
  }

  useEffect(() => {
    if (selectedDisks.length > 0 && duplicateGroups.length === 0 && !isScanning) {
      startScan()
    }
  }, [selectedDisks, duplicateGroups.length, isScanning, startScan])

  return (
    <div className="space-y-4">
      {/* Scan Status */}
      {isScanning && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <RefreshCw className="animate-spin mr-2" size={20} />
              <span className="font-medium">Buscando archivos duplicados...</span>
            </div>
            <span className="text-sm text-muted-foreground">{scanProgress}%</span>
          </div>
          <Progress value={scanProgress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Analizando archivos en los discos seleccionados
          </p>
        </Card>
      )}

      {/* Results Summary */}
      {!isScanning && duplicateGroups.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Grupos encontrados</p>
                <p className="text-2xl font-bold">{duplicateGroups.length}</p>
              </div>
              <Folder className="text-muted-foreground" size={32} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Espacio recuperable</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatSize(savings.recoverable)}
                </p>
              </div>
              <Download className="text-green-600" size={32} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Seleccionado</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatSize(selectedSize)}
                </p>
              </div>
              <Trash2 className="text-orange-600" size={32} />
            </div>
          </Card>
        </div>
      )}

      {/* Action Bar */}
      {duplicateGroups.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedGroups(new Set(duplicateGroups.map(g => g.id)))}
            >
              Expandir todo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedGroups(new Set())}
            >
              Contraer todo
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMoveToRecycleBin}
              disabled={selectedItems.size === 0 || isDeleting}
            >
              <Shield className="mr-2" size={16} />
              Mover a papelera ({selectedItems.size})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={selectedItems.size === 0 || isDeleting}
            >
              <Trash2 className="mr-2" size={16} />
              Eliminar permanentemente ({selectedItems.size})
            </Button>
          </div>
        </div>
      )}

      {/* Duplicate Groups */}
      <div className="space-y-3">
        {duplicateGroups.map(group => (
          <Card key={group.id} className="overflow-hidden">
            {/* Group Header */}
            <div
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    {expandedGroups.has(group.id) ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </div>
                  {getFileIcon(group)}
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {group.items.length} copias • {formatSize(group.totalSize)} total • 
                      <span className="text-green-600 ml-1">
                        {formatSize(group.recoverable)} recuperable
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setComparisonGroup(group)
                      setShowComparison(true)
                    }}
                  >
                    <Eye className="mr-1" size={14} />
                    Comparar
                  </Button>
                  <Checkbox
                    checked={group.items.every(item => 
                      item.shouldKeep || selectedItems.has(item.id)
                    )}
                    onCheckedChange={(checked) => selectAllInGroup(group, !!checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>

            {/* Group Items */}
            {expandedGroups.has(group.id) && (
              <div className="border-t">
                {group.items.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 border-b last:border-0 ${
                      item.shouldKeep 
                        ? 'bg-green-50 dark:bg-green-950/20' 
                        : selectedItems.has(item.id)
                        ? 'bg-red-50 dark:bg-red-950/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex items-center">
                          {item.shouldKeep ? (
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <Star className="text-yellow-600" size={16} />
                            </div>
                          ) : (
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() => toggleItemSelection(item.id)}
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.path}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                            <span>Disco {item.disk}:</span>
                            <span>{formatSize(item.size)}</span>
                            <span>Modificado: {item.modified.toLocaleDateString()}</span>
                            {item.isOriginal && (
                              <span className="text-green-600 font-medium">Original</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!item.shouldKeep && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Toggle keep status
                              const updatedGroups = duplicateGroups.map(g => {
                                if (g.id === group.id) {
                                  return {
                                    ...g,
                                    items: g.items.map(i => ({
                                      ...i,
                                      shouldKeep: i.id === item.id ? true : i.shouldKeep
                                    }))
                                  }
                                }
                                return g
                              })
                              setDuplicateGroups(updatedGroups)
                            }}
                          >
                            <Star className="mr-1" size={14} />
                            Conservar
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <FolderOpen size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!isScanning && duplicateGroups.length === 0 && (
        <Card className="p-8">
          <div className="text-center">
            <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
            <h3 className="text-lg font-semibold mb-2">No se encontraron duplicados</h3>
            <p className="text-muted-foreground mb-4">
              No hay archivos duplicados en los discos seleccionados
            </p>
            <Button onClick={startScan}>
              <RefreshCw className="mr-2" size={16} />
              Ejecutar nuevo análisis
            </Button>
          </div>
        </Card>
      )}

      {/* File Comparison Dialog */}
      {comparisonGroup && (
        <FileComparison
          items={comparisonGroup.items}
          open={showComparison}
          onOpenChange={setShowComparison}
          onKeepSelection={(itemId) => {
            // Update the group to mark the selected item as shouldKeep
            setDuplicateGroups(prev => 
              prev.map(group => {
                if (group.id === comparisonGroup.id) {
                  return {
                    ...group,
                    items: group.items.map(item => ({
                      ...item,
                      shouldKeep: item.id === itemId
                    }))
                  }
                }
                return group
              })
            )
            // Update selected items
            setSelectedItems(prev => {
              const newSet = new Set(prev)
              comparisonGroup.items.forEach(item => {
                if (item.id !== itemId) {
                  newSet.add(item.id)
                } else {
                  newSet.delete(item.id)
                }
              })
              return newSet
            })
          }}
        />
      )}
    </div>
  )
}