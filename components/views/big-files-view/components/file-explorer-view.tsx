import React from "react";
"use client"

import { useState } from "react"
import { EnhancedFileExplorer } from "@/components/enhanced-file-explorer"

// Define the file system structure types
interface FileSystemItem {
  id: string
  name: string
  type: "file" | "folder" | "drive"
  size?: number
  children?: FileSystemItem[]
  path: string
}

// Sample data structure for the file explorer
const sampleData: FileSystemItem[] = [
  {
    id: "drive-c",
    name: "C: Drive",
    type: "drive",
    path: "/c",
    children: [
      {
        id: "folder-1",
        name: "Program Files",
        type: "folder",
        path: "/c/program-files",
        children: [
          {
            id: "file-1",
            name: "setup.exe",
            type: "file",
            size: 1024 * 1024 * 15, // 15 MB
            path: "/c/program-files/setup.exe",
          },
          {
            id: "file-2",
            name: "config.ini",
            type: "file",
            size: 1024 * 2, // 2 KB
            path: "/c/program-files/config.ini",
          },
        ],
      },
      {
        id: "folder-2",
        name: "Users",
        type: "folder",
        path: "/c/users",
        children: [
          {
            id: "folder-3",
            name: "User1",
            type: "folder",
            path: "/c/users/user1",
            children: [
              {
                id: "file-3",
                name: "profile.jpg",
                type: "file",
                size: 1024 * 1024 * 2.5, // 2.5 MB
                path: "/c/users/user1/profile.jpg",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "drive-d",
    name: "D: Drive",
    type: "drive",
    path: "/d",
    children: [
      {
        id: "folder-4",
        name: "Projects",
        type: "folder",
        path: "/d/projects",
        children: [
          {
            id: "file-4",
            name: "project1.zip",
            type: "file",
            size: 1024 * 1024 * 150, // 150 MB
            path: "/d/projects/project1.zip",
          },
        ],
      },
      {
        id: "folder-5",
        name: "Backups",
        type: "folder",
        path: "/d/backups",
        children: [
          {
            id: "file-5",
            name: "backup_2023.zip",
            type: "file",
            size: 1024 * 1024 * 500, // 500 MB
            path: "/d/backups/backup_2023.zip",
          },
        ],
      },
    ],
  },
]

export function FileExplorerView() {
  const [selectedItem, setSelectedItem] = useState<FileSystemItem | null>(null)

  const handleSelect = (item: FileSystemItem) => {
    setSelectedItem(item)
    console.log("Selected:", item)
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">File Explorer</h2>
      <div className="grid grid-cols-1 gap-4">
        <EnhancedFileExplorer initialData={sampleData} onSelect={handleSelect} />

        {selectedItem && (
          <div className="mt-4 p-4 border rounded-md bg-gray-50">
            <h3 className="font-medium">Selected Item:</h3>
            <div className="mt-2">
              <div>
                <span className="font-medium">Name:</span> {selectedItem.name}
              </div>
              <div>
                <span className="font-medium">Type:</span> {selectedItem.type}
              </div>
              <div>
                <span className="font-medium">Path:</span> {selectedItem.path}
              </div>
              {selectedItem.size !== undefined && (
                <div>
                  <span className="font-medium">Size:</span> {(selectedItem.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
