'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { httpGetApps, httpGetOneUser } from '@/lib/api';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Pagination } from '@/components/Pagination';
import { ItemsPerPageSelector } from '@/components/ItemsPerPageSelector';

export default function HomePage() {
  const router = useRouter();
  const { currentUser, doSetUser } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<any[]>([]);
  const [limit, setLimit] = useState(5);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // Load apps with pagination
  useEffect(() => {
    const loadApps = async () => {
      try {
        setLoading(true);
        const { data: appsData } = await httpGetApps({ limit, offset });

        console.log('appsData', appsData);

        const appsList = appsData.apps || [];
        setApps(appsList);
        
        // Set total from response, fallback to apps length if not provided
        setTotal(appsData.total !== undefined ? appsData.total : appsList.length);
      } catch (error: any) {
        console.error('Error loading apps:', error);
        toast.error(error?.response?.data?.error || 'Failed to load apps. Please try again.');
        setApps([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadApps();
    }
  }, [limit, offset, currentUser]);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data } = await httpGetOneUser();
        if (data && data.user) {
          doSetUser(data.user);
        } else {
          router.push('/login');
          return;
        }
        
        // Check if user has completed onboarding
        const { data: appsData } = await httpGetApps({ limit: 5, offset: 0 });
        const appsList = appsData.apps || [];
        
        if (appsList.length === 0) {
          router.push('/onboard');
          return;
        }
      } catch (error: any) {
        console.error('Auth check error:', error);
        
        if (error?.response?.status === 401) {
          router.push('/login');
        } else {
          console.error('Non-auth error during app check:', error?.response?.data || error?.message);
          toast.error(error?.response?.data?.error || 'Failed to load apps. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, doSetUser]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-between">
      <div>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your AI Agents
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and interact with your AI agents
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ItemsPerPageSelector
            value={limit}
            onChange={(newLimit) => {
              setLimit(newLimit);
              setOffset(0);
            }}
          />
          <Link
            href="/onboard"
            className="inline-flex items-center px-4 py-2 border border-brand-500 text-base font-medium rounded-md text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            + Create New Agent
          </Link>
        </div>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You don't have any agents yet.
            </p>
            <Link
              href="/onboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-500 hover:bg-brand-600 transition-all duration-200 hover:scale-105 active:scale-95 animate-pulse-slow"
            >
              Create Your First Agent
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app, index) => (
              <Link
                key={app._id}
                href={`/agents/${app._id}`}
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {app.displayName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {app.appTagline || 'No description'}
                </p>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      app.aiBot?.status === 'on'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {app.aiBot?.status === 'on' ? 'Online' : 'Offline'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:translate-x-1">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>

       {/* Pagination - only show if total exceeds limit */}
       {total > limit && (
          <div className="mb-8">
            <Pagination
              currentPage={Math.floor(offset / limit) + 1}
              totalPages={Math.ceil(total / limit)}
              onPageChange={(page) => {
                setOffset((page - 1) * limit);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
    </div>
  );
}

