"use client"
import React from "react";

import { useState } from "react"
import {
  FolderOpen,
  Copy,
  FileEdit,
  Trash2,
  FilePlus2,
  FolderPlus,
  ClipboardCopy,
  MoveRight,
  Info,
  Star,
  Clock,
  ExternalLink,
  FileSymlink,
  Download,
  Share2,
  Lock,
  Archive,
} from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuLabel,
} from "@/components/ui/context-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export type FileItem = {
  id: string
  name: string
  type: "file" | "folder" | "drive"
  size?: number
  path: string
  children?: FileItem[]
  lastModified?: Date
  favorite?: boolean
}

type FileContextMenuProps = {
  children: React.ReactNode
  item?: FileItem
  onOpen?: (item: FileItem) => void
  onRename?: (item: FileItem, newName: string) => void
  onDelete?: (item: FileItem) => void
  onCopy?: (item: FileItem) => void
  onCut?: (item: FileItem) => void
  onPaste?: (targetItem: FileItem) => void
  onCreateFile?: (parentItem: FileItem, name: string) => void
  onCreateFolder?: (parentItem: FileItem, name: string) => void
  onAddToFavorites?: (item: FileItem) => void
  onRemoveFromFavorites?: (item: FileItem) => void
  onCopyPath?: (item: FileItem) => void
  onMoveTo?: (item: FileItem, destination: string) => void
  onCopyTo?: (item: FileItem, destination: string) => void
  onShowProperties?: (item: FileItem) => void
  recentLocations?: { name: string; path: string }[]
  favoriteLocations?: { name: string; path: string }[]
  canPaste?: boolean
}

export function FileContextMenu({
  children,
  item,
  onOpen,
  onRename,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onCreateFile,
  onCreateFolder,
  onAddToFavorites,
  onRemoveFromFavorites,
  onCopyPath,
  onMoveTo,
  onCopyTo,
  onShowProperties,
  recentLocations = [],
  favoriteLocations = [],
  canPaste = false,
}: FileContextMenuProps) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false)
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false)
  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")

  const handleRename = () => {
    if (item && onRename) {
      onRename(item, newName)
      setIsRenameDialogOpen(false)
    }
  }

  const handleCreateFile = () => {
    if (item && onCreateFile) {
      onCreateFile(item, newName)
      setIsNewFileDialogOpen(false)
    }
  }

  const handleCreateFolder = () => {
    if (item && onCreateFolder) {
      onCreateFolder(item, newName)
      setIsNewFolderDialogOpen(false)
    }
  }

  const openRenameDialog = () => {
    if (item) {
      setNewName(item.name)
      setIsRenameDialogOpen(true)
    }
  }

  const openNewFileDialog = () => {
    setNewName("New File")
    setIsNewFileDialogOpen(true)
  }

  const openNewFolderDialog = () => {
    setNewName("New Folder")
    setIsNewFolderDialogOpen(true)
  }

  const openPropertiesDialog = () => {
    setIsPropertiesDialogOpen(true)
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (date?: Date) => {
    if (!date) return "Unknown"
    return date.toLocaleString()
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-60">
          {/* Primary actions */}
          {item && (
            <>
              <ContextMenuItem
                onClick={() => item && onOpen && onOpen(item)}
                disabled={item.type === "file" && !onOpen}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Open
                <ContextMenuShortcut>Enter</ContextMenuShortcut>
              </ContextMenuItem>

              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open with
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-60">
                  <ContextMenuItem>Default application</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem>Text Editor</ContextMenuItem>
                  <ContextMenuItem>Image Viewer</ContextMenuItem>
                  <ContextMenuItem>Media Player</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem>Choose another app...</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>

              <ContextMenuSeparator />
            </>
          )}

          {/* Edit actions */}
          <ContextMenuGroup>
            {item && (
              <>
                <ContextMenuItem onClick={() => onCut && item && onCut(item)}>
                  <FileSymlink className="mr-2 h-4 w-4" />
                  Cut
                  <ContextMenuShortcut>⌘X</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onCopy && item && onCopy(item)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                  <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                </ContextMenuItem>
              </>
            )}

            {(item?.type === "folder" || item?.type === "drive") && canPaste && (
              <ContextMenuItem onClick={() => onPaste && item && onPaste(item)}>
                <ClipboardCopy className="mr-2 h-4 w-4" />
                Paste
                <ContextMenuShortcut>⌘V</ContextMenuShortcut>
              </ContextMenuItem>
            )}

            {item && (
              <>
                <ContextMenuItem onClick={openRenameDialog}>
                  <FileEdit className="mr-2 h-4 w-4" />
                  Rename
                  <ContextMenuShortcut>F2</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onCopyPath && item && onCopyPath(item)}>
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copy path
                </ContextMenuItem>
              </>
            )}
          </ContextMenuGroup>

          <ContextMenuSeparator />

          {/* Location actions */}
          {item && (
            <>
              <ContextMenuLabel>Move to</ContextMenuLabel>

              {recentLocations.length > 0 && (
                <ContextMenuGroup>
                  {recentLocations.slice(0, 3).map((location) => (
                    <ContextMenuItem
                      key={location.path}
                      onClick={() => onMoveTo && item && onMoveTo(item, location.path)}
                    >
                      <Clock className="mr-2 h-4 w-4 text-primary" />
                      {location.name} (recent)
                    </ContextMenuItem>
                  ))}
                </ContextMenuGroup>
              )}

              {favoriteLocations.length > 0 && (
                <ContextMenuGroup>
                  {favoriteLocations.slice(0, 3).map((location) => (
                    <ContextMenuItem
                      key={location.path}
                      onClick={() => onMoveTo && item && onMoveTo(item, location.path)}
                    >
                      <Star className="mr-2 h-4 w-4 text-yellow-500" /> {/* Mantener amarillo para favoritos o usar variable si existe */} 
                      {location.name} (favorite)
                    </ContextMenuItem>
                  ))}
                </ContextMenuGroup>
              )}

              <ContextMenuItem className="text-primary">More destinations...</ContextMenuItem>

              <ContextMenuSeparator />
            </>
          )}

          {/* File operations */}
          <ContextMenuGroup>
            {item && (
              <>
                <ContextMenuItem onClick={() => onCopyTo && item && onCopyTo(item, "")}>
                  <Copy className="mr-2 h-4 w-4 text-green-600" /> {/* Considerar variable de tema si existe para 'success' o similar */} 
                  Copy to...
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onMoveTo && item && onMoveTo(item, "")}>
                  <MoveRight className="mr-2 h-4 w-4 text-purple-600" /> {/* Considerar variable de tema si existe */} 
                  Move to...
                </ContextMenuItem>
              </>
            )}

            {(item?.type === "folder" || item?.type === "drive") && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={openNewFileDialog}>
                  <FilePlus2 className="mr-2 h-4 w-4" />
                  New file
                </ContextMenuItem>
                <ContextMenuItem onClick={openNewFolderDialog}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New folder
                </ContextMenuItem>
              </>
            )}
          </ContextMenuGroup>

          <ContextMenuSeparator />

          {/* Additional actions */}
          <ContextMenuGroup>
            {item && (
              <>
                {item.favorite ? (
                  <ContextMenuItem onClick={() => onRemoveFromFavorites && onRemoveFromFavorites(item)}>
                    <Star className="mr-2 h-4 w-4 text-yellow-500 fill-yellow-500" /> {/* Mantener amarillo para favoritos o usar variable si existe */} 
                    Remove from favorites
                  </ContextMenuItem>
                ) : (
                  <ContextMenuItem onClick={() => onAddToFavorites && onAddToFavorites(item)}>
                    <Star className="mr-2 h-4 w-4 text-yellow-500" /> {/* Mantener amarillo para favoritos o usar variable si existe */} 
                    Add to favorites
                  </ContextMenuItem>
                )}

                {item.type === "file" && (
                  <ContextMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </ContextMenuItem>
                )}

                <ContextMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </ContextMenuItem>

                <ContextMenuItem>
                  <Lock className="mr-2 h-4 w-4" />
                  Permissions
                </ContextMenuItem>

                <ContextMenuItem>
                  <Archive className="mr-2 h-4 w-4" />
                  Compress
                </ContextMenuItem>
              </>
            )}
          </ContextMenuGroup>

          <ContextMenuSeparator />

          {/* Danger zone */}
          {item && (
            <ContextMenuItem
              onClick={() => onDelete && item && onDelete(item)}
              className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
              <ContextMenuShortcut>Del</ContextMenuShortcut>
            </ContextMenuItem>
          )}

          {/* Properties */}
          {item && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={openPropertiesDialog}>
                <Info className="mr-2 h-4 w-4 text-primary" />
                Properties
                <ContextMenuShortcut>Alt+Enter</ContextMenuShortcut>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename {item?.type}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="name" className="sr-only">
                Name
              </Label>
              <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleRename}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New File Dialog */}
      <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create new file</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="fileName" className="sr-only">
                File name
              </Label>
              <Input id="fileName" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFileDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreateFile}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create new folder</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="folderName" className="sr-only">
                Folder name
              </Label>
              <Input id="folderName" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreateFolder}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Properties Dialog */}
      <Dialog open={isPropertiesDialogOpen} onOpenChange={setIsPropertiesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{item?.name} Properties</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Type</h3>
                <p className="text-sm text-muted-foreground">{item?.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : ''}</p>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium">Location</h3>
                <p className="text-sm text-muted-foreground break-all">{item?.path}</p>
              </div>
              <Separator />
              {item?.type === "file" && (
                <>
                  <div>
                    <h3 className="text-sm font-medium">Size</h3>
                    <p className="text-sm text-muted-foreground">{formatBytes(item?.size)}</p>
                  </div>
                  <Separator />
                </>
              )}
              <div>
                <h3 className="text-sm font-medium">Last modified</h3>
                <p className="text-sm text-muted-foreground">{formatDate(item?.lastModified)}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPropertiesDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
