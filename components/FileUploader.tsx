'use client';

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Files } from '@/lib/types';

interface FileUploaderProps {
  files: Files[];
  onFilesChange: (files: File[]) => void;
  onDeleteFile?: (fileId: string) => void;
  onRemoveFileFromUpload?: (fileName: string) => void;
  progress?: Record<string, number>;
  acceptedTypes?: string;
  localFiles?: Files[];
  setLocalFiles?: Dispatch<SetStateAction<Files[]>>
}

export function FileUploader({
  files,
  localFiles,
  setLocalFiles,
  onFilesChange,
  onDeleteFile,
  onRemoveFileFromUpload,
  progress = {},
  acceptedTypes = '.pdf,.docx,.txt',
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Files[]>([]);
  const [initialFiles, setInitialFiles] = useState<Files[]>([]);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (files) {
      setInitialFiles(files);
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
      }
    }
  }, [files]);

  const allFiles: Files[] = useMemo(() => {
    return [...initialFiles, ...uploadedFiles, ...(localFiles || [])];
  }, [initialFiles, uploadedFiles, localFiles]);

  const handleSetFiles = async () => {
    const filesToUpload = localFiles?.filter((f) => f.file);
    
    if (filesToUpload?.length === 0) {
      console.warn('No files to upload');
      return;
    }
    
    try {
      const fileObjects = filesToUpload?.map((f) => f.file!);
      onFilesChange(fileObjects || []);
    } catch (error) {
      console.error('Error setting files', error);
    }
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: Files[] = Array.from(selectedFiles).map((file) => ({
      id: `pending-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
      md: '',
      mdByteSize: file.size,
      url: file.name,
      file: file,
    }));

    setLocalFiles?.((prev) => [...prev, ...newFiles]);
    
    const fileObjects = newFiles.map((f) => f.file!);
    onFilesChange(fileObjects);
  };

  const handleIconButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleRemoveFile = async (fileId: string) => {
    const isLocalFile = localFiles?.some((f) => f.id === fileId && f.file);
    
    if (isLocalFile) {
      const fileToRemove = localFiles?.find((f) => f.id === fileId);
      setLocalFiles?.((prev) => prev.filter((f) => f.id !== fileId));
      
      if (fileToRemove && onRemoveFileFromUpload) {
        const fileName = fileToRemove.url.split('/').pop() || fileToRemove.url;
        onRemoveFileFromUpload(fileName);
      }
      return;
    }
    
    try {
      onDeleteFile?.(fileId);
      
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
      setInitialFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      console.error('Error removing file', error);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 text-red-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      );
    }
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-12 h-12 text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const getFileName = (url: string | undefined): string => {
    if (!url) return 'Unknown file';
    return url.split('/').pop() || url;
  };

  return (
    <div className="py-6 p-0 md:p-6">
    <div className="flex flex-wrap gap-4">
  {allFiles.map((file) => (
    <div
      key={file.id}
      className={`relative w-[130px] h-[130px] border-2 rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200
        ${file.file ? 'border-yellow-900 bg-yellow-500' : 'border-gray-300 bg-gray-500'}
        hover:border-black hover:bg-gray-900`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleRemoveFile(file.id);
        }}
        className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors duration-200"
      >
        ✕
      </button>

      <div className="flex-1 flex items-center justify-center mt-2">
        {getFileIcon(getFileName(file.url))}
      </div>

      <div
        className="w-full text-center px-1 pb-1 text-xs font-medium text-gray-700 truncate"
        title={getFileName(file.url)}
      >
        {getFileName(file.url)}
      </div>
    </div>
  ))}

  <div
    onClick={handleIconButtonClick}
    onDragEnter={handleDragEnter}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    className={`border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200
      ${allFiles.length === 0 ? 'w-full h-40' : 'w-[130px] h-[130px]'}
      ${isDragging ? 'border-black bg-gray-900' : 'border-gray-300 bg-gray-700'}
      hover:border-black hover:bg-gray-900`}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`w-12 h-12 mb-1 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
    <div className="text-xs text-gray-500 text-center px-1">
      Drag & Drop or click to select files
    </div>
  </div>
</div>

<input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.csv,.json,.doc,.docx,.pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

</div>
  );
}

