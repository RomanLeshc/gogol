'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { httpGetOneUser, httpGetUserStats, httpGetUserRestrictions, handleApiError } from '@/lib/api';
import { UserStats, UserRestrictions } from '@/lib/types';
import { toast } from 'react-toastify';
import { Header } from '@/components/Header';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
}

function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center">
              <span
                className={`text-sm font-medium ${
                  trend.value >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {trend.label}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

function UsageBar({ label, used, limit, unit = '' }: UsageBarProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span
          className={`font-semibold ${
            isOverLimit
              ? 'text-red-600 dark:text-red-400'
              : isNearLimit
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {used.toLocaleString()} / {limit.toLocaleString()} {unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            isOverLimit
              ? 'bg-red-500'
              : isNearLimit
              ? 'bg-yellow-500'
              : 'bg-brand-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isNearLimit && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          {isOverLimit
            ? 'Limit exceeded'
            : 'Approaching limit - consider upgrading'}
        </p>
      )}
    </div>
  );
}

interface FeatureBadgeProps {
  enabled: boolean;
  label: string;
}

function FeatureBadge({ enabled, label }: FeatureBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          enabled
            ? 'bg-green-500'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
      />
      <span
        className={`text-sm ${
          enabled
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-gray-400 line-through'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const { currentUser, doSetUser } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [restrictions, setRestrictions] = useState<UserRestrictions | null>(
    null
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check authentication
        const { data: userData } = await httpGetOneUser();
        if (userData && userData.user) {
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
            theme: userData.user.theme as
              | 'light'
              | 'dark'
              | 'system'
              | undefined,
          });
        } else {
          router.push('/login');
          return;
        }

        // Load stats and restrictions in parallel
        const [statsResponse, restrictionsResponse] = await Promise.all([
          httpGetUserStats(),
          httpGetUserRestrictions(),
        ]);

        setStats(statsResponse.data.stats);
        setRestrictions(restrictionsResponse.data.restrictions);
      } catch (error: any) {
        console.error('Failed to load stats:', error);
        const apiError = handleApiError(error);

        if (error?.response?.status === 401) {
          router.push('/login');
        } else {
          toast.error(
            apiError.message || 'Failed to load statistics. Please try again.'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, doSetUser]);

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Usage & Statistics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor your usage and view your plan restrictions
          </p>
        </div>

        {/* Plan Badge */}
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

        {/* Usage Statistics Cards */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Usage Overview
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total API Calls"
                value={stats.totalApiCalls}
                subtitle={`${stats.recentlyApiCalls} in last ${stats.period}`}
                trend={{
                  value: stats.recentlyApiCalls > 0 ? 10 : -5,
                  label: 'vs previous period',
                }}
              />
              <StatCard
                title="Total Files"
                value={stats.totalFiles}
                subtitle={`${stats.recentlyFiles} in last ${stats.period}`}
              />
              <StatCard
                title="Total Chats"
                value={stats.totalChats}
                subtitle={`${stats.recentlyChats} in last ${stats.period}`}
              />
              <StatCard
                title="Total Sessions"
                value={stats.totalSessions}
                subtitle={`${stats.recentlySessions} in last ${stats.period}`}
              />
            </div>
          </div>
        )}

        {/* Usage Limits */}
        {restrictions && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Usage Limits
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
              <UsageBar
                label="Agents"
                used={restrictions.usage.agentsUsed}
                limit={restrictions.limits.maxAgents}
              />
              <UsageBar
                label="API Calls (Monthly)"
                used={restrictions.usage.apiCallsUsed}
                limit={restrictions.limits.maxApiCallsPerMonth}
              />
              <UsageBar
                label="Files"
                used={restrictions.usage.filesUsed}
                limit={restrictions.limits.maxFilesPerAgent}
              />
              <UsageBar
                label="Chats (Monthly)"
                used={restrictions.usage.chatsUsed}
                limit={restrictions.limits.maxChatsPerMonth}
              />
              <UsageBar
                label="Sessions (Monthly)"
                used={restrictions.usage.sessionsUsed}
                limit={restrictions.limits.maxSessionsPerMonth}
              />
              <UsageBar
                label="Storage"
                used={restrictions.usage.storageUsedGB}
                limit={restrictions.limits.maxStorageGB}
                unit="GB"
              />
            </div>
          </div>
        )}

        {/* Feature Access */}
        {restrictions && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Feature Access
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FeatureBadge
                  enabled={restrictions.features.canCreateAgents}
                  label="Create Agents"
                />
                <FeatureBadge
                  enabled={restrictions.features.canUploadFiles}
                  label="Upload Files"
                />
                <FeatureBadge
                  enabled={restrictions.features.canUseRAG}
                  label="RAG (Retrieval Augmented Generation)"
                />
                <FeatureBadge
                  enabled={restrictions.features.canUseCustomDomains}
                  label="Custom Domains"
                />
                <FeatureBadge
                  enabled={restrictions.features.canUseWebhooks}
                  label="Webhooks"
                />
                <FeatureBadge
                  enabled={restrictions.features.canExportData}
                  label="Data Export"
                />
                <FeatureBadge
                  enabled={restrictions.features.canAccessAPI}
                  label="API Access"
                />
              </div>
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
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

