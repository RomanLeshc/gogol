import { ModelApp } from '@/lib/types';

interface IndexingTabProps {
  app: ModelApp;
  newUrl: string;
  followLink: boolean;
  indexingLoading: boolean;
  onUrlChange: (url: string) => void;
  onFollowLinkChange: (follow: boolean) => void;
  onAddWebsite: () => void;
  onDeleteUrl: (url: string) => void;
}

export function IndexingTab({
  app,
  newUrl,
  followLink,
  indexingLoading,
  onUrlChange,
  onFollowLinkChange,
  onAddWebsite,
  onDeleteUrl,
}: IndexingTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Website Indexing
        </h2>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Add Website to Index
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="website-url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Website URL
            </label>
            <input
              id="website-url"
              type="url"
              value={newUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
              placeholder="https://example.com"
            />
          </div>
          <div className="flex items-center">
            <input
              id="follow-link"
              type="checkbox"
              checked={followLink}
              onChange={(e) => onFollowLinkChange(e.target.checked)}
              className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded"
            />
            <label
              htmlFor="follow-link"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              Follow links (crawl linked pages)
            </label>
          </div>
          <button
            onClick={onAddWebsite}
            disabled={!newUrl.trim() || indexingLoading}
            className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {indexingLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Indexing...
              </>
            ) : (
              'Start Indexing'
            )}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Indexed URLs ({app.aiBot?.siteUrlsV2?.length || 0})
        </h3>
        {app.aiBot?.isRAG ? (
          app.aiBot.siteUrlsV2 && app.aiBot.siteUrlsV2.length > 0 ? (
            <div className="space-y-2">
              {app.aiBot.siteUrlsV2.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {site.url}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {site.mdByteSize} bytes • {new Date(site.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteUrl(site.url)}
                    className="ml-4 text-red-500 hover:text-red-700"
                    title="Remove URL"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No URLs indexed yet. Add a website above to start indexing.
            </p>
          )
        ) : (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              RAG is not enabled. Enable it in Settings to start indexing websites.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

