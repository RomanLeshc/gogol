'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/Header';
import { OverviewTab } from './components/OverviewTab';
import { DocumentsTab } from './components/DocumentsTab';
import { IndexingTab } from './components/IndexingTab';
import { SettingsTab } from './components/SettingsTab';
import { ChatTab } from './components/ChatTab';
import { TabNavigation } from './components/TabNavigation';
import { useAgentData } from './hooks/useAgentData';
import { useAgentHandlers } from './hooks/useAgentHandlers';
import { copyToClipboard } from './utils/clipboard';

type Tab = 'overview' | 'documents' | 'indexing' | 'settings' | 'chat';

export default function AgentDetailPage() {
  const params = useParams();
  const { currentUser } = useAppStore();
  const agentId = params.id as string;
  const { app, loading, loadAgent, setApp } = useAgentData(agentId);
  const handlers = useAgentHandlers({ app, loadAgent, setApp });

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copiedEmbed, setCopiedEmbed] = useState<'script' | 'npm' | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [followLink, setFollowLink] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#overview' || hash === '') {
        setActiveTab('overview');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleCopyEmbed = async (text: string, type: 'script' | 'npm') => {
    await copyToClipboard(text);
    setCopiedEmbed(type);
    setTimeout(() => setCopiedEmbed(null), 2000);
  };

  const handleAddWebsite = async () => {
    await handlers.handleAddWebsite(newUrl, followLink);
    setNewUrl('');
  };

  const handleUploadDocuments = async () => {
    await handlers.handleUploadDocuments(uploadedFiles, setUploadProgress);
    setUploadedFiles([]);
    setUploadProgress({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  if (!app || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/agents"
            className="text-sm text-brand-600 hover:text-brand-700 mb-4 inline-block"
          >
            ← Back to Agents
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {app.displayName}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {app.appTagline || 'No description'}
          </p>
        </div>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              app={app}
              agentId={agentId}
              copiedEmbed={copiedEmbed}
              onCopyEmbed={handleCopyEmbed}
            />
          )}
          {activeTab === 'documents' && (
            <DocumentsTab
              app={app}
              uploadedFiles={uploadedFiles}
              uploadProgress={uploadProgress}
              uploadingDocuments={handlers.uploadingDocuments}
              onFilesChange={setUploadedFiles}
              onUpload={handleUploadDocuments}
              onDeleteUrl={handlers.handleDeleteUrl}
            />
          )}
          {activeTab === 'indexing' && (
            <IndexingTab
              app={app}
              newUrl={newUrl}
              followLink={followLink}
              indexingLoading={handlers.indexingLoading}
              onUrlChange={setNewUrl}
              onFollowLinkChange={setFollowLink}
              onAddWebsite={handleAddWebsite}
              onDeleteUrl={handlers.handleDeleteUrl}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              app={app}
              saving={handlers.saving}
              deleting={handlers.deleting}
              onUpdate={handlers.handleUpdateSettings}
              onDelete={handlers.handleDelete}
            />
          )}
          {activeTab === 'chat' && <ChatTab agentId={agentId} app={app} />}
        </div>
      </div>
    </div>
  );
}
