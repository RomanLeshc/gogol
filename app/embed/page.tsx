'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/Header';
import { toast } from 'react-toastify';

export default function EmbedPage() {
  const { apps, currentUser } = useAppStore();
  const [selectedAgentId, setSelectedAgentId] = useState(
    apps.length > 0 ? apps[0]._id : ''
  );

  // Simple copy to clipboard function
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success('Copied to clipboard!');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Copied to clipboard!');
    }
  };

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE || 'https://api.ethoradev.com/v1';
  const embedKey = process.env.NEXT_PUBLIC_EMBED_KEY || '';

  const scriptSnippet = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed.js" data-agent-id="${selectedAgentId}" data-api-base="${apiBase}" data-embed-key="${embedKey}" data-position="bottom-right"></script>`;

  const npmSnippet = `npm install @ethora/ai-widget

import { initEthoraWidget } from '@ethora/ai-widget';

initEthoraWidget({
  agentId: '${selectedAgentId}',
  apiBase: '${apiBase}',
  embedKey: '${embedKey}',
  position: 'bottom-right',
  theme: 'light'
});`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Embed Your AI Agent
        </h1>

        {apps.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need to create an agent first.
            </p>
            <a
              href="/onboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-brand-500 hover:bg-brand-600"
            >
              Create Agent
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Agent Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Agent
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                {apps.map((app) => (
                  <option key={app._id} value={app._id}>
                    {app.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Script Embed */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Script Embed
                </h2>
                <button
                  onClick={() => copyToClipboard(scriptSnippet)}
                  className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 text-sm"
                >
                  Copy
                </button>
              </div>
              <pre className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-x-auto text-sm">
                <code className="text-gray-900 dark:text-gray-100">
                  {scriptSnippet}
                </code>
              </pre>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Add this script tag to your HTML page to embed the chat widget.
              </p>
            </div>

            {/* NPM Package */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  NPM Package
                </h2>
                <button
                  onClick={() => copyToClipboard(npmSnippet)}
                  className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 text-sm"
                >
                  Copy
                </button>
              </div>
              <pre className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-x-auto text-sm">
                <code className="text-gray-900 dark:text-gray-100">
                  {npmSnippet}
                </code>
              </pre>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Install the npm package and initialize the widget in your
                React/Next.js app.
              </p>
            </div>

            {/* Configuration Options */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Configuration Options
              </h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-300">
                    data-agent-id
                  </dt>
                  <dd className="text-gray-600 dark:text-gray-400">
                    Required. The ID of your agent.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-300">
                    data-api-base
                  </dt>
                  <dd className="text-gray-600 dark:text-gray-400">
                    Optional. API base URL (defaults to production API).
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-300">
                    data-embed-key
                  </dt>
                  <dd className="text-gray-600 dark:text-gray-400">
                    Optional. Embed key for authentication.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-300">
                    data-position
                  </dt>
                  <dd className="text-gray-600 dark:text-gray-400">
                    Optional. Widget position: bottom-right, bottom-left,
                    top-right, top-left (default: bottom-right).
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-300">
                    data-theme
                  </dt>
                  <dd className="text-gray-600 dark:text-gray-400">
                    Optional. Theme: light, dark (default: light).
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
