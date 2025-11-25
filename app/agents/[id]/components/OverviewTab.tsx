'use client';

import { ModelApp } from '@/lib/types';
import { useState } from 'react';

interface OverviewTabProps {
  app: ModelApp;
  agentId: string;
  copiedEmbed: 'script' | 'npm' | null;
  onCopyEmbed: (text: string, type: 'script' | 'npm') => void;
}

export function OverviewTab({ app, agentId, copiedEmbed, onCopyEmbed }: OverviewTabProps) {
  const [displayName, setDisplayName] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('');
  
  // const getScriptSnippet = () => {
  //   const apiBase =
  //     process.env.NEXT_PUBLIC_API_BASE ||
  //     process.env.NEXT_PUBLIC_API_V1 ||
  //     'https://api.ethoradev.com/v1';
  //   const embedKey = process.env.NEXT_PUBLIC_EMBED_KEY || '';
  //   return `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed.js" data-agent-id="${agentId}" data-api-base="${apiBase}" data-embed-key="${embedKey}" data-position="bottom-right"></script>`;
  // };

  const getScriptSnippet = () => {
    return `<script src="https://widget.ethora.com/assistant.js" id="chat-content-assistant" data-bot-id="${app._id}_${agentId}-bot@xmpp.ethoradev.com" ${displayName ? `data-bot-display-name="${displayName}"` : ''} ${avatar ? `data-bot-avatar="${avatar}"` : ''}></script>`;
  };

  const getNpmSnippet = () => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE ||
      process.env.NEXT_PUBLIC_API_V1 ||
      'https://api.ethoradev.com/v1';
    const embedKey = process.env.NEXT_PUBLIC_EMBED_KEY || '';
    return `npm install @ethora/ai-widget

import { initEthoraWidget } from '@ethora/ai-widget';

initEthoraWidget({
  agentId: '${agentId}',
  apiBase: '${apiBase}',
  embedKey: '${embedKey}',
  position: 'bottom-right',
  theme: 'light'
});`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Agent Information
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Status
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
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
              Created
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {new Date(app.createdAt).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Last Updated
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {new Date(app.updatedAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Embed Code
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Copy the code below to embed this AI agent on your website.
        </p>

        <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-8">
            <div className="md:w-1/2 w-full">
              <p className="font-sans text-sm pb-4 flex items-center gap-1">
                Which Display Name should the bot use?
              </p>
              <input
                type="text"
                maxLength={24}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                }}
              />
            </div>

            <div className="md:w-1/2 w-full">
              <p className="font-sans text-sm pb-4 flex items-center gap-1">
                Bot avatar URL (optional)
              </p>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="url"
                value={avatar}
                onChange={(e) => {
                  setAvatar(e.target.value);
                }}
              />
            </div>
          </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Script Embed
            </label>
            <button
              onClick={() => onCopyEmbed(getScriptSnippet(), 'script')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                copiedEmbed === 'script'
                  ? 'bg-green-500 text-white'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              } transition-colors`}
            >
              {copiedEmbed === 'script' ? '✓ Copied' : 'Copy Script'}
            </button>
          </div>
          <pre className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-x-auto text-sm border border-gray-200 dark:border-gray-700">
            <code className="text-gray-900 dark:text-gray-100">{getScriptSnippet()}</code>
          </pre>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Add this script tag to your HTML page to embed the chat widget.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              NPM Package
            </label>
            <button
              onClick={() => onCopyEmbed(getNpmSnippet(), 'npm')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                copiedEmbed === 'npm'
                  ? 'bg-green-500 text-white'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              } transition-colors`}
            >
              {copiedEmbed === 'npm' ? '✓ Copied' : 'Copy NPM'}
            </button>
          </div>
          <pre className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-x-auto text-sm border border-gray-200 dark:border-gray-700">
            <code className="text-gray-900 dark:text-gray-100">{getNpmSnippet()}</code>
          </pre>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Install the npm package and initialize the widget in your React/Next.js app.
          </p>
        </div>
      </div>
    </div>
  );
}

