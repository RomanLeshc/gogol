import { UserRestrictions } from '@/lib/types';
import { UsageBar } from '@/components/stats/UsageBar';

interface UsageLimitsSectionProps {
  restrictions: UserRestrictions;
}

export function UsageLimitsSection({ restrictions }: UsageLimitsSectionProps) {
  return (
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
  );
}

