// Re-export common utilities
export { formatBytes, getFileName, getDirectory, normalizePath, getFileType } from './scanner';
export { validatePath, isSubPath } from './operations';

// Additional utility functions
export function getFileExtension(path: string): string {
  const fileName = getFileName(path);
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : '';
}

export function removeFileExtension(path: string): string {
  const ext = getFileExtension(path);
  return ext ? path.slice(0, -(ext.length + 1)) : path;
}

export function sanitizeFileName(name: string): string {
  // Remove invalid characters
  return name.replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\.+$/, '') // Remove trailing dots
    .trim();
}

export function generateUniqueFileName(baseName: string, existingNames: string[]): string {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }
  
  const ext = getFileExtension(baseName);
  const nameWithoutExt = removeFileExtension(baseName);
  let counter = 1;
  let newName: string;
  
  do {
    newName = ext 
      ? `${nameWithoutExt} (${counter}).${ext}`
      : `${nameWithoutExt} (${counter})`;
    counter++;
  } while (existingNames.includes(newName));
  
  return newName;
}

export function getMimeType(path: string): string {
  const ext = getFileExtension(path);
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', bmp: 'image/bmp', svg: 'image/svg+xml',
    webp: 'image/webp', ico: 'image/x-icon',
    // Videos
    mp4: 'video/mp4', avi: 'video/x-msvideo', mkv: 'video/x-matroska',
    mov: 'video/quicktime', wmv: 'video/x-ms-wmv', webm: 'video/webm',
    // Audio
    mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac',
    aac: 'audio/aac', ogg: 'audio/ogg', m4a: 'audio/mp4',
    // Documents
    pdf: 'application/pdf', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain', rtf: 'application/rtf',
    // Archives
    zip: 'application/zip', rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed', tar: 'application/x-tar',
    // Data
    json: 'application/json', xml: 'application/xml',
    csv: 'text/csv', sql: 'application/sql',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}