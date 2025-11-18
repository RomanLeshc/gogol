'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  httpGetApp,
  httpGetOneUser,
  httpUpdateApp,
  deleteApp,
  setSourcesSiteCrawl,
  postDocument,
  deleteSourcesSiteCrawlV2,
} from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/Header';
import { ModelApp } from '@/lib/types';
import { ChatWidget } from '@/components/ChatWidget';
import { FileUploader } from '@/components/FileUploader';
import { toast } from 'react-toastify';

type Tab = 'overview' | 'documents' | 'indexing' | 'settings' | 'chat';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, doSetUser, doSetCurrentApp } = useAppStore();
  const [app, setApp] = useState<ModelApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState<'script' | 'npm' | null>(null);
  
  // Indexing state
  const [newUrl, setNewUrl] = useState('');
  const [followLink, setFollowLink] = useState(true);
  const [indexingLoading, setIndexingLoading] = useState(false);
  
  // Documents state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  const agentId = params.id as string;

  const loadAgent = async () => {
    try {
      setLoading(true);
      // Check auth
      const { data: userData } = await httpGetOneUser();
      doSetUser({
        _id: userData.user._id,
        appId: userData.user.appId,
        firstName: userData.user.firstName,
        lastName: userData.user.lastName,
        homeScreen: userData.user.homeScreen || '',
        isAgreeWithTerms: userData.user.isAgreeWithTerms || false,
        isAssetsOpen: userData.user.isAssetsOpen || false,
        isProfileOpen: userData.user.isProfileOpen || false,
        token: '',
        refreshToken: '',
        wsToken: '',
        walletAddress: userData.user.defaultWallet?.walletAddress || '',
        xmppPassword: userData.user.xmppPassword || '',
        xmppUsername: userData.user.xmppUsername || '',
        profileImage: userData.user.profileImage || '',
        description: userData.user.description || '',
        defaultWallet: {
          walletAddress: userData.user.defaultWallet?.walletAddress || '',
        },
        email: userData.user.email,
        orgId: userData.user.orgId,
        theme: userData.user.theme as 'light' | 'dark' | 'system' | undefined,
      });

      // Load agent/app
      const { data: appData } = await httpGetApp(agentId);
      setApp(appData.result);
      doSetCurrentApp(appData.result);
    } catch (error: any) {
      console.error('Failed to load agent:', error);
      if (error?.response?.status === 401) {
        router.push('/login');
      } else {
        router.push('/agents');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agentId) {
      loadAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  // Handle hash navigation to open overview tab
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#overview' || hash === '') {
        setActiveTab('overview');
      }
    };

    // Check hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const copyToClipboard = (text: string, type: 'script' | 'npm') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedEmbed(type);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopiedEmbed(null), 2000);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedEmbed(type);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedEmbed(null), 2000);
    }
  };

  const handleDelete = async () => {
    if (!app || !confirm(`Are you sure you want to delete "${app.displayName}"?`)) {
      return;
    }

    try {
      await deleteApp(app._id);
      toast.success('Agent deleted successfully');
      router.push('/agents');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete agent');
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

  const handleAddWebsite = async () => {
    if (!app || !newUrl.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIndexingLoading(true);
    try {
      // Ensure RAG is enabled
      if (!app.aiBot?.isRAG) {
        await httpUpdateApp(app._id, {
          aiBot: {
            ...app.aiBot!,
            isRAG: true,
            status: app.aiBot?.status || 'on',
          },
        });
      }

      // Add website source
      await setSourcesSiteCrawl(app._id, newUrl.trim(), followLink);
      toast.success('Website indexing started');
      setNewUrl('');
      
      // Reload agent data to get updated URLs
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
      
      // Reload agent data
      await loadAgent();
    } catch (error: any) {
      console.error('Delete URL error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove URL');
    }
  };

  const handleUploadDocuments = async () => {
    if (!app || uploadedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploadingDocuments(true);
    try {
      // Ensure RAG is enabled
      if (!app.aiBot?.isRAG) {
        await httpUpdateApp(app._id, {
          aiBot: {
            ...app.aiBot!,
            isRAG: true,
            status: app.aiBot?.status || 'on',
          },
        });
      }

      // Upload documents
      const uploadPromises = uploadedFiles.map(async (file) => {
        try {
          setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
          await postDocument(file.name, file);
          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          throw error;
        }
      });

      await Promise.all(uploadPromises);
      toast.success('Documents uploaded successfully');
      setUploadedFiles([]);
      setUploadProgress({});
      
      // Reload agent data
      await loadAgent();
    } catch (error: any) {
      console.error('Upload documents error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload documents');
    } finally {
      setUploadingDocuments(false);
    }
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

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: 'Documents' },
    { id: 'indexing', label: 'Indexing' },
    { id: 'settings', label: 'Settings' },
    { id: 'chat', label: 'Chat Preview' },
  ];

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

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Agent Information
                </h2>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          app.aiBot?.status === 'on'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {app.aiBot?.status === 'on' ? 'Online' : 'Offline'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      RAG Enabled
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {app.aiBot?.isRAG ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Updated
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(app.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Embed Code Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Embed Code
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Copy the code below to embed this AI agent on your website.
                </p>

                {/* Script Embed */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Script Embed
                    </label>
                    <button
                      onClick={() => {
                        const apiBase =
                          process.env.NEXT_PUBLIC_API_BASE ||
                          process.env.NEXT_PUBLIC_API_V1 ||
                          'https://api.ethoradev.com/v1';
                        const embedKey = process.env.NEXT_PUBLIC_EMBED_KEY || '';
                        const scriptSnippet = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed.js" data-agent-id="${agentId}" data-api-base="${apiBase}" data-embed-key="${embedKey}" data-position="bottom-right"></script>`;
                        copyToClipboard(scriptSnippet, 'script');
                      }}
                      className={`px-3 py-1.5 text-sm rounded-md ${
                        copiedEmbed === 'script'
                          ? 'bg-green-500 text-white'
                          : 'bg-brand-500 text-white hover:bg-brand-600'
                      } transition-colors`}
                    >
                      {copiedEmbed === 'script' ? '✓ Copied' : 'Copy Script'}
                    </button>
                  </div>
                  <pre className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-x-auto text-sm border border-gray-200 dark:border-gray-700">
                    <code className="text-gray-900 dark:text-gray-100">
                      {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed.js" data-agent-id="${agentId}" data-api-base="${process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_V1 || 'https://api.ethoradev.com/v1'}" data-embed-key="${process.env.NEXT_PUBLIC_EMBED_KEY || ''}" data-position="bottom-right"></script>`}
                    </code>
                  </pre>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Add this script tag to your HTML page to embed the chat widget.
                  </p>
                </div>

                {/* NPM Package */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      NPM Package
                    </label>
                    <button
                      onClick={() => {
                        const apiBase =
                          process.env.NEXT_PUBLIC_API_BASE ||
                          process.env.NEXT_PUBLIC_API_V1 ||
                          'https://api.ethoradev.com/v1';
                        const embedKey = process.env.NEXT_PUBLIC_EMBED_KEY || '';
                        const npmSnippet = `npm install @ethora/ai-widget

import { initEthoraWidget } from '@ethora/ai-widget';

initEthoraWidget({
  agentId: '${agentId}',
  apiBase: '${apiBase}',
  embedKey: '${embedKey}',
  position: 'bottom-right',
  theme: 'light'
});`;
                        copyToClipboard(npmSnippet, 'npm');
                      }}
                      className={`px-3 py-1.5 text-sm rounded-md ${
                        copiedEmbed === 'npm'
                          ? 'bg-green-500 text-white'
                          : 'bg-brand-500 text-white hover:bg-brand-600'
                      } transition-colors`}
                    >
                      {copiedEmbed === 'npm' ? '✓ Copied' : 'Copy NPM'}
                    </button>
                  </div>
                  <pre className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-x-auto text-sm border border-gray-200 dark:border-gray-700">
                    <code className="text-gray-900 dark:text-gray-100">
                      {`npm install @ethora/ai-widget

import { initEthoraWidget } from '@ethora/ai-widget';

initEthoraWidget({
  agentId: '${agentId}',
  apiBase: '${process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_V1 || 'https://api.ethoradev.com/v1'}',
  embedKey: '${process.env.NEXT_PUBLIC_EMBED_KEY || ''}',
  position: 'bottom-right',
  theme: 'light'
});`}
                    </code>
                  </pre>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Install the npm package and initialize the widget in your React/Next.js app.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Documents
                </h2>
              </div>

              {/* Upload Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Upload Documents
                </h3>
                <FileUploader
                  files={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                  progress={uploadProgress}
                  acceptedTypes=".pdf,.docx,.txt"
                />
                {uploadedFiles.length > 0 && (
                  <button
                    onClick={handleUploadDocuments}
                    disabled={uploadingDocuments}
                    className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingDocuments ? 'Uploading...' : 'Upload Documents'}
                  </button>
                )}
              </div>

              {/* Documents List */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Indexed Documents ({app.aiBot?.siteUrlsV2?.length || 0})
                </h3>
                {app.aiBot?.siteUrlsV2 && app.aiBot.siteUrlsV2.length > 0 ? (
                  <div className="space-y-2">
                    {app.aiBot.siteUrlsV2.map((site) => (
                      <div
                        key={site.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {site.url}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {site.mdByteSize} bytes • {new Date(site.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteUrl(site.url)}
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
          )}

          {activeTab === 'indexing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Website Indexing
                </h2>
              </div>

              {/* Add Website Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Add Website to Index
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="website-url"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Website URL
                    </label>
                    <input
                      id="website-url"
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      id="follow-link"
                      type="checkbox"
                      checked={followLink}
                      onChange={(e) => setFollowLink(e.target.checked)}
                      className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="follow-link"
                      className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      Follow links (crawl linked pages)
                    </label>
                  </div>
                  <button
                    onClick={handleAddWebsite}
                    disabled={!newUrl.trim() || indexingLoading}
                    className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {indexingLoading ? 'Indexing...' : 'Start Indexing'}
                  </button>
                </div>
              </div>

              {/* Indexed URLs List */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Indexed URLs ({app.aiBot?.siteUrlsV2?.length || 0})
                </h3>
                {app.aiBot?.isRAG ? (
                  app.aiBot.siteUrlsV2 && app.aiBot.siteUrlsV2.length > 0 ? (
                    <div className="space-y-2">
                      {app.aiBot.siteUrlsV2.map((site) => (
                        <div
                          key={site.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {site.url}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {site.mdByteSize} bytes • {new Date(site.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteUrl(site.url)}
                            className="ml-4 text-red-500 hover:text-red-700"
                            title="Remove URL"
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
                      No URLs indexed yet. Add a website above to start indexing.
                    </p>
                  )
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      RAG is not enabled. Enable it in Settings to start indexing websites.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Agent Settings
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={app.displayName}
                  onChange={(e) =>
                    handleUpdateSettings({ displayName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={app.appTagline || ''}
                  onChange={(e) =>
                    handleUpdateSettings({ appTagline: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Bot Status
                </label>
                <select
                  value={app.aiBot?.status || 'off'}
                  onChange={(e) =>
                    handleUpdateSettings({
                      aiBot: {
                        ...app.aiBot!,
                        status: e.target.value as 'on' | 'off',
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="on">On</option>
                  <option value="off">Off</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  id="rag-enabled"
                  type="checkbox"
                  checked={app.aiBot?.isRAG || false}
                  onChange={(e) =>
                    handleUpdateSettings({
                      aiBot: {
                        ...app.aiBot!,
                        isRAG: e.target.checked,
                        status: app.aiBot?.status || 'on',
                      },
                    })
                  }
                  className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="rag-enabled"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Enable RAG (Retrieval-Augmented Generation)
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Agent
                </button>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Chat Preview
              </h2>
              <div className="h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <ChatWidget agentId={agentId} app={app} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

