'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { httpGetApps, httpGetOneUser, httpUpdateApp, deleteApp } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/Header';
import { ModelApp, AgentStatus } from '@/lib/types';
import { toast } from 'react-toastify';

function getAgentStatus(app: ModelApp): AgentStatus {
  if (!app.aiBot) {
    return 'pending';
  }
  if (app.aiBot.status === 'off') {
    return 'error';
  }
  if (app.aiBot.isRAG && (!app.aiBot.siteUrlsV2 || app.aiBot.siteUrlsV2.length === 0)) {
    return 'indexing';
  }
  return 'ready';
}

export default function SimpleAdminPage() {
  const router = useRouter();
  const { currentUser, apps, doSetUser, doSetApps } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ModelApp | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
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

        const { data: appsData } = await httpGetApps({});
        doSetApps(appsData.apps || []);
        
        if (appsData.apps && appsData.apps.length > 0) {
          setSelectedApp(appsData.apps[0]);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, doSetUser, doSetApps]);

  const handleToggleStatus = async (app: ModelApp) => {
    try {
      const newStatus = app.aiBot?.status === 'on' ? 'off' : 'on';
      await httpUpdateApp(app._id, {
        aiBot: {
          ...app.aiBot!,
          status: newStatus,
        },
      });
      toast.success(`Agent ${newStatus === 'on' ? 'enabled' : 'disabled'}`);
      // Reload apps
      const { data: appsData } = await httpGetApps({});
      doSetApps(appsData.apps || []);
      if (selectedApp?._id === app._id) {
        setSelectedApp(appsData.apps.find((a: ModelApp) => a._id === app._id));
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update agent');
    }
  };

  const handleDelete = async (appId: string, appName: string) => {
    if (!confirm(`Are you sure you want to delete "${appName}"?`)) {
      return;
    }

    try {
      await deleteApp(appId);
      toast.success('Agent deleted successfully');
      const { data: appsData } = await httpGetApps({});
      doSetApps(appsData.apps || []);
      if (selectedApp?._id === appId) {
        setSelectedApp(null);
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete agent');
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

  if (!currentUser) {
    return null;
  }

  const statusColors: Record<AgentStatus, string> = {
    indexing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  const statusLabels: Record<AgentStatus, string> = {
    indexing: 'Indexing',
    ready: 'Ready',
    error: 'Error',
    pending: 'Pending',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your AI agents and settings
          </p>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No agents found. Create your first agent to get started.
            </p>
            <Link
              href="/onboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-500 hover:bg-brand-600"
            >
              Create Agent
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agents List */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Agents ({apps.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {apps.map((app) => {
                    const status = getAgentStatus(app);
                    return (
                      <button
                        key={app._id}
                        onClick={() => setSelectedApp(app)}
                        className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedApp?._id === app._id
                            ? 'bg-brand-50 dark:bg-brand-900/20'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {app.displayName}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
                          >
                            {statusLabels[status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {app.appTagline || 'No description'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Agent Details */}
            <div className="lg:col-span-2">
              {selectedApp ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {selectedApp.displayName}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {selectedApp.appTagline || 'No description'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleStatus(selectedApp)}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          selectedApp.aiBot?.status === 'on'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {selectedApp.aiBot?.status === 'on' ? 'Stop' : 'Start'}
                      </button>
                      <Link
                        href={`/agents/${selectedApp._id}`}
                        className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedApp.aiBot?.status === 'on'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {selectedApp.aiBot?.status === 'on' ? 'Online' : 'Offline'}
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        RAG Enabled
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedApp.aiBot?.isRAG ? 'Yes' : 'No'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Indexed Sources
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedApp.aiBot?.siteUrlsV2?.length || 0} URL(s)
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Created
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(selectedApp.createdAt).toLocaleDateString()}
                      </dd>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleDelete(selectedApp._id, selectedApp.displayName)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                      >
                        Delete Agent
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Select an agent to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

