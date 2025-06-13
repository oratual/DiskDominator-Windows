import { useState, useCallback } from 'react';
import { invoke } from './use-tauri';
import { CompressionOptions, CompressionResult } from './use-large-files';

export interface CompressionJob {
  id: string;
  filePath: string;
  fileName: string;
  status: 'pending' | 'compressing' | 'completed' | 'failed';
  progress?: number;
  result?: CompressionResult;
  error?: string;
}

export const useFileCompression = () => {
  const [jobs, setJobs] = useState<CompressionJob[]>([]);
  const [activeJobs, setActiveJobs] = useState<number>(0);

  const compressFile = useCallback(async (
    filePath: string,
    fileName: string,
    options: CompressionOptions
  ): Promise<CompressionResult> => {
    const jobId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add job to queue
    const newJob: CompressionJob = {
      id: jobId,
      filePath,
      fileName,
      status: 'pending'
    };
    
    setJobs(prev => [...prev, newJob]);
    
    try {
      // Update job status to compressing
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'compressing' } : job
      ));
      setActiveJobs(prev => prev + 1);
      
      // Perform compression
      const result = await invoke<CompressionResult>('compress_file', {
        file_path: filePath,
        options
      });
      
      // Update job with result
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'completed', result } : job
      ));
      
      return result;
    } catch (error) {
      // Update job with error
      const errorMsg = error instanceof Error ? error.message : 'Compression failed';
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'failed', error: errorMsg } : job
      ));
      throw error;
    } finally {
      setActiveJobs(prev => prev - 1);
    }
  }, []);

  const compressBatch = useCallback(async (
    files: Array<{ path: string; name: string }>,
    options: CompressionOptions
  ): Promise<CompressionResult[]> => {
    const results: CompressionResult[] = [];
    
    // Process files in parallel (max 3 at a time)
    const batchSize = 3;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(file => compressFile(file.path, file.name, options))
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }
    
    return results;
  }, [compressFile]);

  const clearCompleted = useCallback(() => {
    setJobs(prev => prev.filter(job => job.status !== 'completed'));
  }, []);

  const clearFailed = useCallback(() => {
    setJobs(prev => prev.filter(job => job.status !== 'failed'));
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const getCompressionStats = useCallback((): {
    totalJobs: number;
    completed: number;
    failed: number;
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalSpaceSaved: number;
    averageCompressionRatio: number;
  } => {
    const completedJobs = jobs.filter(job => job.status === 'completed' && job.result);
    const failedJobs = jobs.filter(job => job.status === 'failed');
    
    const stats = completedJobs.reduce((acc, job) => {
      if (job.result) {
        acc.originalSize += job.result.original_size;
        acc.compressedSize += job.result.compressed_size;
      }
      return acc;
    }, { originalSize: 0, compressedSize: 0 });
    
    const spaceSaved = stats.originalSize - stats.compressedSize;
    const avgRatio = stats.originalSize > 0 
      ? (spaceSaved / stats.originalSize) * 100 
      : 0;
    
    return {
      totalJobs: jobs.length,
      completed: completedJobs.length,
      failed: failedJobs.length,
      totalOriginalSize: stats.originalSize,
      totalCompressedSize: stats.compressedSize,
      totalSpaceSaved: spaceSaved,
      averageCompressionRatio: avgRatio
    };
  }, [jobs]);

  const suggestCompressionFormat = (fileType: string, size: number): CompressionOptions => {
    // Suggest format based on file type and size
    const gb = 1024 * 1024 * 1024;
    
    if (fileType === 'archive') {
      // Already compressed, suggest keeping original
      return {
        format: 'zip',
        level: 'fast',
        keep_original: true
      };
    }
    
    if (size > gb) {
      // Large files - use tar.gz for better compression
      return {
        format: 'tar_gz',
        level: 'best',
        keep_original: true
      };
    }
    
    if (['text', 'code', 'log', 'document'].includes(fileType)) {
      // Text-based files compress well
      return {
        format: 'zip',
        level: 'best',
        keep_original: false
      };
    }
    
    // Default for other files
    return {
      format: 'zip',
      level: 'normal',
      keep_original: true
    };
  };

  return {
    jobs,
    activeJobs,
    compressFile,
    compressBatch,
    clearCompleted,
    clearFailed,
    removeJob,
    getCompressionStats,
    suggestCompressionFormat
  };
};