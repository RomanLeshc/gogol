'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { httpGetApp, httpGetOneUser, httpUpdateApp, deleteApp } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/Header';
import { ModelApp } from '@/lib/types';
import { ChatWidget } from '@/components/ChatWidget';
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

  const agentId = params.id as string;

  useEffect(() => {
    const loadAgent = async () => {
      try {
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
      } catch (error) {
        console.error('Failed to load agent:', error);
        router.push('/agents');
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      loadAgent();
    }
  }, [agentId, router, doSetUser, doSetCurrentApp]);

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
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Documents
              </h2>
              {app.aiBot?.siteUrlsV2 && app.aiBot.siteUrlsV2.length > 0 ? (
                <div className="space-y-2">
                  {app.aiBot.siteUrlsV2.map((site) => (
                    <div
                      key={site.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {site.url}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {site.mdByteSize} bytes • {new Date(site.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No documents indexed yet.
                </p>
              )}
            </div>
          )}

          {activeTab === 'indexing' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Indexing Status
              </h2>
              {app.aiBot?.isRAG ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      RAG is enabled for this agent.
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Indexed URLs: {app.aiBot.siteUrlsV2?.length || 0}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  RAG is not enabled. Enable it in Settings.
                </p>
              )}
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

