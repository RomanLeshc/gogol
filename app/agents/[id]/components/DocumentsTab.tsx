import { ModelApp } from '@/lib/types';
import { FileUploader } from '@/components/FileUploader';

interface DocumentsTabProps {
  app: ModelApp;
  uploadedFiles: File[];
  uploadProgress: Record<string, number>;
  uploadingDocuments: boolean;
  onFilesChange: (files: File[]) => void;
  onUpload: () => void;
  onDeleteFile: (url: string) => void;
}

export function DocumentsTab({
  app,
  uploadedFiles,
  uploadProgress,
  uploadingDocuments,
  onFilesChange,
  onUpload,
  onDeleteFile,
}: DocumentsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Documents
        </h2>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Upload Documents
        </h3>
        <FileUploader
          files={uploadedFiles}
          onFilesChange={onFilesChange}
          progress={uploadProgress}
          acceptedTypes=".pdf,.docx,.txt"
        />
        {uploadedFiles.length > 0 && (
          <button
            onClick={onUpload}
            disabled={uploadingDocuments}
            className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploadingDocuments ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              'Upload Documents'
            )}
          </button>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Indexed Documents ({app.aiBot?.files?.length || 0})
        </h3>
        {app.aiBot?.files && app.aiBot.files.length > 0 ? (
          <div className="space-y-2">
            {app.aiBot.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.url}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {file.mdByteSize} bytes • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteFile(file.id)}
                  className="ml-4 text-red-500 hover:text-red-700"
                  title="Remove document"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            No documents indexed yet. Upload documents above to get started.
          </p>
        )}
      </div>
    </div>
  );
}

