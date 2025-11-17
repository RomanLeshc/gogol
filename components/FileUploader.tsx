'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';

interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  progress?: Record<string, number>;
  acceptedTypes?: string;
}

export function FileUploader({
  files,
  onFilesChange,
  progress = {},
  acceptedTypes = '.pdf,.docx,.txt',
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return acceptedTypes.split(',').includes(ext);
      });

      onFilesChange([...files, ...droppedFiles]);
    },
    [files, onFilesChange, acceptedTypes]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []).filter((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return acceptedTypes.split(',').includes(ext);
      });

      onFilesChange([...files, ...selectedFiles]);
    },
    [files, onFilesChange, acceptedTypes]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      onFilesChange(newFiles);
    },
    [files, onFilesChange]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept={acceptedTypes}
          onChange={handleFileSelect}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <svg
            className="w-12 h-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span className="font-semibold text-brand-500">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {acceptedTypes} (MAX. 10MB per file)
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Files ({files.length})
          </h3>
          {files.map((file, index) => (
            <motion.div
              key={`${file.name}-${index}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
                {progress[file.name] !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-brand-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress[file.name]}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => removeFile(index)}
                className="ml-4 text-red-500 hover:text-red-700"
                aria-label="Remove file"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

