import { UserStats } from '@/lib/types';
import { StatCard } from '@/components/stats/StatCard';

interface UsageOverviewSectionProps {
  stats: UserStats;
}

export function UsageOverviewSection({ stats }: UsageOverviewSectionProps) {
  return (
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
  );
}

