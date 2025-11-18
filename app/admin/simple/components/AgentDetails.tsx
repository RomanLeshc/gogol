import Link from 'next/link';
import { ModelApp } from '@/lib/types';

interface AgentDetailsProps {
  app: ModelApp;
  togglingId: string | null;
  deletingId: string | null;
  onToggleStatus: () => void;
  onDelete: () => void;
}

export function AgentDetails({
  app,
  togglingId,
  deletingId,
  onToggleStatus,
  onDelete,
}: AgentDetailsProps) {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {app.displayName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {app.appTagline || 'No description'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onToggleStatus}
              disabled={togglingId === app._id}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                app.aiBot?.status === 'on'
                  ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {togglingId === app._id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Updating...
                </>
              ) : (
                app.aiBot?.status === 'on' ? 'Stop' : 'Start'
              )}
            </button>
            <Link
              href={`/agents/${app._id}`}
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
                  app.aiBot?.status === 'on'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {app.aiBot?.status === 'on' ? 'Online' : 'Offline'}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              RAG Enabled
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {app.aiBot?.isRAG ? 'Yes' : 'No'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Indexed Sources
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {app.aiBot?.siteUrlsV2?.length || 0} URL(s)
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Created
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {new Date(app.createdAt).toLocaleDateString()}
            </dd>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onDelete}
              disabled={deletingId === app._id}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deletingId === app._id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                'Delete Agent'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

