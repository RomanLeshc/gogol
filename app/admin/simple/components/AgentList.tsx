import { ModelApp, AgentStatus } from '@/lib/types';

interface AgentListProps {
  apps: ModelApp[];
  selectedApp: ModelApp | null;
  onSelectApp: (app: ModelApp) => void;
  statusColors: Record<AgentStatus, string>;
  statusLabels: Record<AgentStatus, string>;
}

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

export function AgentList({
  apps,
  selectedApp,
  onSelectApp,
  statusColors,
  statusLabels,
}: AgentListProps) {
  return (
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
                onClick={() => onSelectApp(app)}
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
  );
}

