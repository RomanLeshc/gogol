'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { httpGetApps, httpGetOneUser } from '@/lib/api';
import { handleApiError } from '@/lib/api';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { Header } from '@/components/Header';

export default function HomePage() {
  const router = useRouter();
  const { currentUser, apps, doSetUser, doSetApps } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data } = await httpGetOneUser();
        if (data && data.user) {
          doSetUser(data.user);
        } else {
          // If no user data, redirect to login
          router.push('/login');
          return;
        }
        
        // Check if user has completed onboarding (has at least one app/agent)
        // Use limit 5 (API minimum requirement) but we only need to check if any exist
        const { data: appsData } = await httpGetApps({ limit: 5 });
        doSetApps(appsData.apps || []);
        
        if (!appsData.apps || appsData.apps.length === 0) {
          // Redirect to onboarding if no agents exist
          router.push('/onboard');
          return;
        }
      } catch (error: any) {
        console.error('Auth check error:', error);
        
        // Only redirect to login on authentication errors (401)
        // Don't logout on validation errors (400) or other API errors
        if (error?.response?.status === 401) {
          // Authentication failed, redirect to login
          router.push('/login');
        } else {
          // Other errors (validation, network, etc.) - show error but don't logout
          console.error('Non-auth error during app check:', error?.response?.data || error?.message);
          toast.error(error?.response?.data?.error || 'Failed to load apps. Please try again.');
          // Still set empty apps array to prevent infinite loops
          doSetApps([]);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, doSetUser, doSetApps]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your AI Agents
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and interact with your AI agents
          </p>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-12">
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
            {apps.map((app) => (
              <Link
                key={app._id}
                href={`/agents/${app._id}`}
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {app.displayName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {app.appTagline || 'No description'}
                </p>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      app.aiBot?.status === 'on'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {app.aiBot?.status === 'on' ? 'Online' : 'Offline'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/onboard"
            className="inline-flex items-center px-4 py-2 border border-brand-500 text-base font-medium rounded-md text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20"
          >
            + Create New Agent
          </Link>
        </div>
      </div>
    </div>
  );
}

