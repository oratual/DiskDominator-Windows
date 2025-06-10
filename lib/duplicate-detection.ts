// Duplicate detection utilities
// This will be replaced with real file system scanning in Tauri backend

export interface DuplicateGroup {
  id: string
  hash: string
  name: string
  type: 'file' | 'folder'
  mimeType?: string
  totalSize: number
  totalCount: number
  recoverable: number
  items: DuplicateItem[]
}

export interface DuplicateItem {
  id: string
  path: string
  size: number
  modified: Date
  created: Date
  disk: string
  isOriginal: boolean
  shouldKeep: boolean
  metadata?: {
    width?: number
    height?: number
    duration?: number
    bitrate?: number
  }
}

export type DuplicateDetectionMethod = 'hash' | 'name' | 'size' | 'content'
export type GroupingMethod = 'hash' | 'name' | 'type' | 'location'

export interface DuplicateScanOptions {
  disks: string[]
  minSize?: number
  maxSize?: number
  includeHidden?: boolean
  includeSystem?: boolean
  fileTypes?: string[]
  excludePaths?: string[]
  method: DuplicateDetectionMethod
  groupBy: GroupingMethod
}

// Simulated duplicate detection
export async function detectDuplicates(options: DuplicateScanOptions): Promise<DuplicateGroup[]> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Generate mock data based on options
  const mockGroups: DuplicateGroup[] = [
    {
      id: 'dup-1',
      hash: 'a1b2c3d4e5f6',
      name: 'vacation-photos-2023',
      type: 'folder',
      totalSize: 1.8 * 1024 * 1024 * 1024,
      totalCount: 2,
      recoverable: 900 * 1024 * 1024,
      items: [
        {
          id: 'item-1-1',
          path: 'D:/Photos/Vacations/2023',
          size: 900 * 1024 * 1024,
          modified: new Date('2023-08-15'),
          created: new Date('2023-08-10'),
          disk: 'D',
          isOriginal: true,
          shouldKeep: true,
        },
        {
          id: 'item-1-2',
          path: 'E:/Backup/Photos/Vacations/2023',
          size: 900 * 1024 * 1024,
          modified: new Date('2023-08-20'),
          created: new Date('2023-08-20'),
          disk: 'E',
          isOriginal: false,
          shouldKeep: false,
        }
      ]
    },
    {
      id: 'dup-2',
      hash: 'b2c3d4e5f6g7',
      name: 'Italy2023.mp4',
      type: 'file',
      mimeType: 'video/mp4',
      totalSize: 3.5 * 1024 * 1024 * 1024,
      totalCount: 3,
      recoverable: 2.3 * 1024 * 1024 * 1024,
      items: [
        {
          id: 'item-2-1',
          path: 'D:/Videos/Vacations/Italy2023.mp4',
          size: 1.2 * 1024 * 1024 * 1024,
          modified: new Date('2023-05-12'),
          created: new Date('2023-05-12'),
          disk: 'D',
          isOriginal: true,
          shouldKeep: true,
          metadata: {
            duration: 1800, // seconds
            width: 1920,
            height: 1080,
            bitrate: 5000000
          }
        },
        {
          id: 'item-2-2',
          path: 'C:/Users/User/Videos/Italy2023.mp4',
          size: 1.2 * 1024 * 1024 * 1024,
          modified: new Date('2023-05-15'),
          created: new Date('2023-05-15'),
          disk: 'C',
          isOriginal: false,
          shouldKeep: false,
          metadata: {
            duration: 1800,
            width: 1920,
            height: 1080,
            bitrate: 5000000
          }
        },
        {
          id: 'item-2-3',
          path: 'E:/Backup/Videos/Italy2023.mp4',
          size: 1.1 * 1024 * 1024 * 1024,
          modified: new Date('2023-05-15'),
          created: new Date('2023-05-15'),
          disk: 'E',
          isOriginal: false,
          shouldKeep: false,
          metadata: {
            duration: 1800,
            width: 1920,
            height: 1080,
            bitrate: 5000000
          }
        }
      ]
    },
    {
      id: 'dup-3',
      hash: 'c3d4e5f6g7h8',
      name: 'project-report.docx',
      type: 'file',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      totalSize: 15 * 1024 * 1024,
      totalCount: 4,
      recoverable: 11.25 * 1024 * 1024,
      items: [
        {
          id: 'item-3-1',
          path: 'C:/Users/User/Documents/Projects/project-report.docx',
          size: 3.75 * 1024 * 1024,
          modified: new Date('2024-01-10'),
          created: new Date('2024-01-05'),
          disk: 'C',
          isOriginal: true,
          shouldKeep: true,
        },
        {
          id: 'item-3-2',
          path: 'C:/Users/User/Desktop/project-report.docx',
          size: 3.75 * 1024 * 1024,
          modified: new Date('2024-01-10'),
          created: new Date('2024-01-10'),
          disk: 'C',
          isOriginal: false,
          shouldKeep: false,
        },
        {
          id: 'item-3-3',
          path: 'D:/Work/Reports/project-report.docx',
          size: 3.75 * 1024 * 1024,
          modified: new Date('2024-01-11'),
          created: new Date('2024-01-11'),
          disk: 'D',
          isOriginal: false,
          shouldKeep: false,
        },
        {
          id: 'item-3-4',
          path: 'E:/Backup/Documents/project-report.docx',
          size: 3.75 * 1024 * 1024,
          modified: new Date('2024-01-11'),
          created: new Date('2024-01-11'),
          disk: 'E',
          isOriginal: false,
          shouldKeep: false,
        }
      ]
    }
  ]

  // Filter by selected disks
  if (options.disks.length > 0) {
    mockGroups.forEach(group => {
      group.items = group.items.filter(item => options.disks.includes(item.disk))
      group.totalCount = group.items.length
      group.recoverable = group.items
        .filter(item => !item.shouldKeep)
        .reduce((sum, item) => sum + item.size, 0)
    })
  }

  // Filter out groups with less than 2 items
  return mockGroups.filter(group => group.items.length >= 2)
}

// Smart duplicate detection algorithm
export function determineOriginal(items: DuplicateItem[]): DuplicateItem {
  // Sort by multiple criteria to find the best "original"
  const sorted = [...items].sort((a, b) => {
    // 1. Prefer items not in temp/cache/backup folders
    const aIsTemp = /\/(temp|cache|backup|tmp)\//i.test(a.path)
    const bIsTemp = /\/(temp|cache|backup|tmp)\//i.test(b.path)
    if (aIsTemp !== bIsTemp) return aIsTemp ? 1 : -1

    // 2. Prefer older creation date (original)
    const createdDiff = a.created.getTime() - b.created.getTime()
    if (createdDiff !== 0) return createdDiff

    // 3. Prefer organized locations (Documents, Projects, etc)
    const aIsOrganized = /\/(documents|projects|work)\//i.test(a.path)
    const bIsOrganized = /\/(documents|projects|work)\//i.test(b.path)
    if (aIsOrganized !== bIsOrganized) return aIsOrganized ? -1 : 1

    // 4. Prefer shorter paths (less nested)
    const aDepth = a.path.split(/[/\\]/).length
    const bDepth = b.path.split(/[/\\]/).length
    return aDepth - bDepth
  })

  return sorted[0]
}

// Calculate potential disk space savings
export function calculateSavings(groups: DuplicateGroup[]): {
  totalSize: number
  recoverable: number
  byDisk: Record<string, number>
  byType: Record<string, number>
} {
  const byDisk: Record<string, number> = {}
  const byType: Record<string, number> = {}
  let totalSize = 0
  let recoverable = 0

  groups.forEach(group => {
    totalSize += group.totalSize
    recoverable += group.recoverable

    group.items.forEach(item => {
      if (!item.shouldKeep) {
        byDisk[item.disk] = (byDisk[item.disk] || 0) + item.size
        byType[group.type] = (byType[group.type] || 0) + item.size
      }
    })
  })

  return { totalSize, recoverable, byDisk, byType }
}

// Batch operations
export async function deleteDuplicates(itemIds: string[]): Promise<void> {
  // Simulate deletion
  await new Promise(resolve => setTimeout(resolve, 500 * itemIds.length))
  console.log('Deleted items:', itemIds)
}

export async function moveToRecycleBin(itemIds: string[]): Promise<void> {
  // Simulate move to recycle bin
  await new Promise(resolve => setTimeout(resolve, 300 * itemIds.length))
  console.log('Moved to recycle bin:', itemIds)
}