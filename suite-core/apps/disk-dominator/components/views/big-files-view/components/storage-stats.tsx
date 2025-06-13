import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HardDrive, FileText, Image, Film, Music, Archive, Code } from 'lucide-react';
import { SpaceAnalysis } from '@/hooks/use-large-files';

interface StorageStatsProps {
  analysis: SpaceAnalysis;
  className?: string;
}

export function StorageStats({ analysis, className = '' }: StorageStatsProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      document: FileText,
      image: Image,
      video: Film,
      audio: Music,
      archive: Archive,
      code: Code,
      other: HardDrive
    };
    const Icon = icons[type] || HardDrive;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      document: 'bg-yellow-500',
      image: 'bg-blue-500',
      video: 'bg-purple-500',
      audio: 'bg-pink-500',
      archive: 'bg-green-500',
      code: 'bg-cyan-500',
      other: 'bg-gray-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  // Get top file types by size
  const topTypes = Object.entries(analysis.by_type)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 5);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Total Space Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Espacio Total Analizado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBytes(analysis.total_size)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {analysis.file_count.toLocaleString()} archivos
          </p>
          
          {/* Size Distribution */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Gigantes (&gt;10GB)</span>
              <span className="font-medium">{analysis.size_distribution.gigantic}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Enormes (1-10GB)</span>
              <span className="font-medium">{analysis.size_distribution.huge}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Grandes (100MB-1GB)</span>
              <span className="font-medium">{analysis.size_distribution.large}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Types Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tipos de Archivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topTypes.map(([type, data]) => (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(type)}
                    <span className="capitalize">{type}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {data.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={data.percentage} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatBytes(data.size)}</span>
                  <span>{data.count} archivos</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Disk Usage */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Uso por Disco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analysis.by_disk)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([disk, size]) => {
                const percentage = (size / analysis.total_size) * 100;
                return (
                  <div key={disk} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        <span className="font-medium">{disk}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatBytes(size)}
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
