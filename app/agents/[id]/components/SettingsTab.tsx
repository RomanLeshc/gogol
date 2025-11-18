import { ModelApp } from '@/lib/types';

interface SettingsTabProps {
  app: ModelApp;
  saving: boolean;
  deleting: boolean;
  onUpdate: (updates: Partial<ModelApp>) => void;
  onDelete: () => void;
}

export function SettingsTab({
  app,
  saving,
  deleting,
  onUpdate,
  onDelete,
}: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Agent Settings
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Display Name
        </label>
        <input
          type="text"
          value={app.displayName}
          onChange={(e) => onUpdate({ displayName: e.target.value })}
          disabled={saving}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {saving && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand-500"></div>
            Saving...
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tagline
        </label>
        <input
          type="text"
          value={app.appTagline || ''}
          onChange={(e) => onUpdate({ appTagline: e.target.value })}
          disabled={saving}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          AI Bot Status
        </label>
        <select
          value={app.aiBot?.status || 'off'}
          onChange={(e) =>
            onUpdate({
              aiBot: {
                ...app.aiBot!,
                status: e.target.value as 'on' | 'off',
              },
            })
          }
          disabled={saving}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="on">On</option>
          <option value="off">Off</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          id="rag-enabled"
          type="checkbox"
          checked={app.aiBot?.isRAG || false}
          onChange={(e) =>
            onUpdate({
              aiBot: {
                ...app.aiBot!,
                isRAG: e.target.checked,
                status: app.aiBot?.status || 'on',
              },
            })
          }
          disabled={saving}
          className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label
          htmlFor="rag-enabled"
          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
        >
          Enable RAG (Retrieval-Augmented Generation)
        </label>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onDelete}
          disabled={deleting}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {deleting ? (
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
  );
}

