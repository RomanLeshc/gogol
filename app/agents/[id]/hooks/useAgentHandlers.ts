import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  httpUpdateApp,
  deleteApp,
  setSourcesSiteCrawl,
  postDocument,
  deleteSourcesSiteCrawlV2,
  setSourcesSiteFiles,
  setSourcesSiteFilesDelete,
} from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { ModelApp } from '@/lib/types';
import { toast } from 'react-toastify';

interface UseAgentHandlersProps {
  app: ModelApp | null;
  loadAgent: () => Promise<void>;
  setApp: (app: ModelApp) => void;
}

export function useAgentHandlers({ app, loadAgent, setApp }: UseAgentHandlersProps) {
  const router = useRouter();
  const { doSetCurrentApp } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [indexingLoading, setIndexingLoading] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  const handleDelete = async () => {
    if (!app || !confirm(`Are you sure you want to delete "${app.displayName}"?`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteApp(app._id);
      toast.success('Agent deleted successfully');
      router.push('/agents');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete agent');
      setDeleting(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<ModelApp>) => {
    if (!app) return;
    setSaving(true);
    try {
      const { data } = await httpUpdateApp(app._id, updates);
      setApp(data.result);
      doSetCurrentApp(data.result);
      toast.success('Settings updated successfully');
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddWebsite = async (newUrl: string, followLink: boolean) => {
    if (!app || !newUrl.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }
    setIndexingLoading(true);
    try {
      if (!app.aiBot?.isRAG) {
        await httpUpdateApp(app._id, {
          aiBot: { ...app.aiBot!, isRAG: true, status: app.aiBot?.status || 'on' },
        });
      }
      await setSourcesSiteCrawl(app._id, newUrl.trim(), followLink);
      toast.success('Website indexing started');
      await loadAgent();
    } catch (error: any) {
      console.error('Add website error:', error);
      toast.error(error.response?.data?.message || 'Failed to add website');
    } finally {
      setIndexingLoading(false);
    }
  };

  const handleDeleteUrl = async (url: string) => {
    if (!app || !confirm(`Are you sure you want to remove "${url}"?`)) {
      return;
    }
    try {
      await deleteSourcesSiteCrawlV2(app._id, [url]);
      toast.success('URL removed successfully');
      await loadAgent();
    } catch (error: any) {
      console.error('Delete URL error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove URL');
    }
  };

  const handleUploadDocuments = async (
    uploadedFiles: File[],
    setUploadProgress: React.Dispatch<React.SetStateAction<Record<string, number>>>
  ) => {
    if (!app || uploadedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    setUploadingDocuments(true);
    try {
      if (!app.aiBot?.isRAG) {
        await httpUpdateApp(app._id, {
          aiBot: { ...app.aiBot!, isRAG: true, status: app.aiBot?.status || 'on' },
        });
      }

      const { data } = await setSourcesSiteFiles(app._id, uploadedFiles);
      
      toast.success('Documents uploaded successfully');
      await loadAgent();

      return data.result;
    } catch (error: any) {
      console.error('Upload documents error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload documents');
    } finally {
      setUploadingDocuments(false);
    }
  };


  const handleDeleteDocument = async (fileId: string) => {
    if (!app || !fileId) {
      toast.error('Agent or file ID not found');
      return;
    }

    setDeleting(true);
    try {
      await setSourcesSiteFilesDelete(app._id, fileId);

      toast.success('Document deleted successfully');
      await loadAgent();
    } catch (error: any) {
      console.error('Delete document error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  return {
    saving,
    deleting,
    indexingLoading,
    uploadingDocuments,
    handleDelete,
    handleUpdateSettings,
    handleAddWebsite,
    handleDeleteUrl,
    handleUploadDocuments,
    handleDeleteDocument,
  };
}

