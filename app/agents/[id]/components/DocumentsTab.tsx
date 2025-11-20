import { ModelApp } from '@/lib/types';
import { FileUploader } from '@/components/FileUploader';

interface DocumentsTabProps {
  app: ModelApp;
  uploadedFiles: File[];
  uploadProgress: Record<string, number>;
  uploadingDocuments: boolean;
  onFilesChange: (files: File[]) => void;
  onUpload: () => Promise<void>;
  onDeleteFile: (url: string) => void;
  onRemoveFileFromUpload?: (fileName: string) => void;
}

export function DocumentsTab({
  app,
  uploadedFiles,
  uploadProgress,
  uploadingDocuments,
  onFilesChange,
  onUpload,
  onDeleteFile,
  onRemoveFileFromUpload,
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
          Upload Documents ({app.aiBot?.files?.length || 0})
        </h3>
        <FileUploader
          files={app.aiBot?.files || []}
          onDeleteFile={onDeleteFile}
          onFilesChange={onFilesChange}
          onRemoveFileFromUpload={onRemoveFileFromUpload}
          progress={uploadProgress}
          acceptedTypes=".pdf,.docx,.txt"
        />
        {uploadedFiles.length > 0 && (
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                await onUpload();
              } catch (error) {
                console.error('Upload error:', error);
              }
            }}
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

    </div>
  );
}

