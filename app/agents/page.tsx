'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { httpGetApps, httpGetOneUser, deleteApp } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/Header';
import { AgentStatus, ModelApp } from '@/lib/types';
import { toast } from 'react-toastify';

function getAgentStatus(app: ModelApp): AgentStatus {
  // Determine status based on app and aiBot state
  if (!app.aiBot) {
    return 'pending';
  }
  
  if (app.aiBot.status === 'off') {
    return 'error';
  }
  
  // Check if indexing is in progress (simplified - would need actual indexing status from API)
  if (app.aiBot.isRAG && (!app.aiBot.siteUrlsV2 || app.aiBot.siteUrlsV2.length === 0)) {
    return 'indexing';
  }
  
  return 'ready';
}

export default function AgentsPage() {
  const router = useRouter();
  const { currentUser, apps, doSetUser, doSetApps } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
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

        // Load apps/agents
        const { data: appsData } = await httpGetApps({});
        doSetApps(appsData.apps || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, doSetUser, doSetApps]);

  const handleDelete = async (appId: string, appName: string) => {
    if (!confirm(`Are you sure you want to delete "${appName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteApp(appId);
      toast.success('Agent deleted successfully');
      // Reload apps
      const { data: appsData } = await httpGetApps({});
      doSetApps(appsData.apps || []);
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your AI Agents
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage and interact with your AI agents
            </p>
          </div>
          <Link
            href="/onboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-brand-500 hover:bg-brand-600"
          >
            + Create New Agent
          </Link>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You don't have any agents yet.
            </p>
            <Link
              href="/onboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-500 hover:bg-brand-600"
            >
              Create Your First Agent
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => {
              const status = getAgentStatus(app);
              return (
                <div
                  key={app._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {app.displayName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {app.appTagline || 'No description'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
                    >
                      {statusLabels[status]}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        app.aiBot?.status === 'on'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {app.aiBot?.status === 'on' ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/agents/${app._id}`}
                      className="flex-1 text-center px-4 py-2 text-sm font-medium text-brand-600 hover:text-brand-700 border border-brand-500 rounded-md hover:bg-brand-50 dark:hover:bg-brand-900/20"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleDelete(app._id, app.displayName)}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

