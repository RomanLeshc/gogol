'use client';

import { useState } from 'react';
import Link from 'next/link';
import { httpGetApps, httpUpdateApp, deleteApp } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/Header';
import { AgentStatus, ModelApp } from '@/lib/types';
import { toast } from 'react-toastify';
import { AgentList } from './components/AgentList';
import { AgentDetails } from './components/AgentDetails';
import { useAdminData } from './hooks/useAdminData';

export default function SimpleAdminPage() {
  const { apps, doSetApps } = useAppStore();
  const { loading, selectedApp, setSelectedApp } = useAdminData();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleToggleStatus = async (app: ModelApp) => {
    setTogglingId(app._id);
    try {
      const newStatus = app.aiBot?.status === 'on' ? 'off' : 'on';
      await httpUpdateApp(app._id, {
        aiBot: { ...app.aiBot!, status: newStatus },
      });
      toast.success(`Agent ${newStatus === 'on' ? 'enabled' : 'disabled'}`);
      const { data: appsData } = await httpGetApps({});
      doSetApps(appsData.apps || []);
      if (selectedApp?._id === app._id) {
        setSelectedApp(appsData.apps.find((a: ModelApp) => a._id === app._id));
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update agent');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (appId: string, appName: string) => {
    if (!confirm(`Are you sure you want to delete "${appName}"?`)) {
      return;
    }
    setDeletingId(appId);
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
    } finally {
      setDeletingId(null);
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

  const { currentUser } = useAppStore();
  if (!currentUser) {
    return null;
  }

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
            <AgentList
              apps={apps}
              selectedApp={selectedApp}
              onSelectApp={setSelectedApp}
              statusColors={statusColors}
              statusLabels={statusLabels}
            />
            {selectedApp ? (
              <AgentDetails
                app={selectedApp}
                togglingId={togglingId}
                deletingId={deletingId}
                onToggleStatus={() => handleToggleStatus(selectedApp)}
                onDelete={() => handleDelete(selectedApp._id, selectedApp.displayName)}
              />
            ) : (
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Select an agent to view details
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
