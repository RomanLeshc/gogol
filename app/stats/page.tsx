'use client';

import { useAppStore } from '@/lib/store';
import { Header } from '@/components/Header';
import { useStatsData } from './hooks/useStatsData';
import { UsageOverviewSection } from './components/UsageOverviewSection';
import { UsageLimitsSection } from './components/UsageLimitsSection';
import { FeatureAccessSection } from './components/FeatureAccessSection';

export default function StatsPage() {
  const { currentUser } = useAppStore();
  const { loading, stats, restrictions } = useStatsData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Usage & Statistics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor your usage and view your plan restrictions
          </p>
        </div>

        {restrictions && (
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">
                Current Plan:
              </span>
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400 capitalize">
                {restrictions.plan}
              </span>
            </div>
          </div>
        )}

        {stats && <UsageOverviewSection stats={stats} />}
        {restrictions && <UsageLimitsSection restrictions={restrictions} />}
        {restrictions && <FeatureAccessSection restrictions={restrictions} />}

        {restrictions && restrictions.plan === 'free' && (
          <div className="mt-8 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upgrade to Pro
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Get more agents, higher limits, and access to premium features
                </p>
              </div>
              <button className="ml-4 px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
