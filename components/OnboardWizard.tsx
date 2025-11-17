'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  httpCreateNewApp,
  setSourcesSiteCrawl,
  httpPostFile,
  postDocument,
} from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'react-toastify';
import { FileUploader } from './FileUploader';

type SourceType = 'website' | 'documents' | null;
type Step = 'source' | 'configure' | 'settings' | 'finalize';

interface WebsiteConfig {
  url: string;
  followLink: boolean;
  crawlDepth?: number;
  respectRobots?: boolean;
  useSitemap?: boolean;
}

interface AgentSettings {
  name: string;
  personaPrompt: string;
  allowedDomains: string[];
  isPublic: boolean;
}

export function OnboardWizard() {
  const router = useRouter();
  const { doAddApp } = useAppStore();
  const [step, setStep] = useState<Step>('source');
  const [sourceType, setSourceType] = useState<SourceType>(null);
  const [loading, setLoading] = useState(false);
  
  // Website configuration
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig>({
    url: '',
    followLink: true,
    crawlDepth: 3,
    respectRobots: true,
    useSitemap: false,
  });
  
  // Document upload
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  // Agent settings
  const [agentSettings, setAgentSettings] = useState<AgentSettings>({
    name: '',
    personaPrompt: 'You are a helpful AI assistant.',
    allowedDomains: [],
    isPublic: false,
  });

  const handleSourceSelect = (type: SourceType) => {
    setSourceType(type);
    setStep('configure');
  };

  const handleWebsiteSubmit = async () => {
    if (!websiteConfig.url) {
      toast.error('Please enter a website URL');
      return;
    }

    setStep('settings');
  };

  const handleDocumentsSubmit = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    setStep('settings');
  };

  const handleFinalize = async () => {
    if (!agentSettings.name) {
      toast.error('Please enter an agent name');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the app/agent
      const { data: appData } = await httpCreateNewApp(agentSettings.name);
      const appId = appData.app._id;

      // Step 2: Configure source based on type
      if (sourceType === 'website') {
        // Add website crawl source
        await setSourcesSiteCrawl(
          appId,
          websiteConfig.url,
          websiteConfig.followLink
        );
        toast.success('Website indexing started');
      } else if (sourceType === 'documents') {
        // Upload documents
        const uploadPromises = uploadedFiles.map(async (file) => {
          try {
            setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
            await postDocument(file.name, file);
            setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            throw error;
          }
        });

        await Promise.all(uploadPromises);
        toast.success('Documents uploaded successfully');
      }

      // Step 3: Update app with agent settings
      // Note: The API might need additional endpoints for updating agent-specific settings
      // For now, we'll use the standard app update endpoint
      // await httpUpdateApp(appId, {
      //   aiBot: {
      //     prompt: agentSettings.personaPrompt,
      //     isRAG: true,
      //     status: 'on',
      //   },
      // });

      doAddApp(appData.app);
      toast.success('Agent created successfully!');
      
      // Redirect to agent detail page
      router.push(`/agents/${appId}`);
    } catch (error: any) {
      console.error('Agent creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Your AI Agent
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set up your AI agent by providing knowledge sources
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(['source', 'configure', 'settings', 'finalize'] as Step[]).map(
              (s, index) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step === s
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : index <
                          (['source', 'configure', 'settings', 'finalize'] as Step[]).indexOf(
                            step
                          )
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        index <
                        (['source', 'configure', 'settings', 'finalize'] as Step[]).indexOf(
                          step
                        )
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === 'source' && (
            <motion.div
              key="source"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-8"
            >
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                Choose Knowledge Source
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleSourceSelect('website')}
                  className="p-6 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-brand-500 dark:hover:border-brand-500 transition-colors text-left"
                >
                  <div className="text-3xl mb-3">🌐</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    Website URL
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Index content from a website by providing a URL
                  </p>
                </button>
                <button
                  onClick={() => handleSourceSelect('documents')}
                  className="p-6 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-brand-500 dark:hover:border-brand-500 transition-colors text-left"
                >
                  <div className="text-3xl mb-3">📄</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    Upload Documents
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Upload PDF, DOCX, or TXT files
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'configure' && sourceType === 'website' && (
            <motion.div
              key="website-config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-8"
            >
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                Website Configuration
              </h2>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="url"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Website URL
                  </label>
                  <input
                    id="url"
                    type="url"
                    value={websiteConfig.url}
                    onChange={(e) =>
                      setWebsiteConfig({ ...websiteConfig, url: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                    placeholder="https://example.com"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id="followLink"
                    type="checkbox"
                    checked={websiteConfig.followLink}
                    onChange={(e) =>
                      setWebsiteConfig({
                        ...websiteConfig,
                        followLink: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="followLink"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Follow links (crawl depth: {websiteConfig.crawlDepth})
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="respectRobots"
                    type="checkbox"
                    checked={websiteConfig.respectRobots}
                    onChange={(e) =>
                      setWebsiteConfig({
                        ...websiteConfig,
                        respectRobots: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="respectRobots"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Respect robots.txt
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="useSitemap"
                    type="checkbox"
                    checked={websiteConfig.useSitemap}
                    onChange={(e) =>
                      setWebsiteConfig({
                        ...websiteConfig,
                        useSitemap: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="useSitemap"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Use sitemap.xml
                  </label>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('source')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleWebsiteSubmit}
                    className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'configure' && sourceType === 'documents' && (
            <motion.div
              key="documents-config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-8"
            >
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                Upload Documents
              </h2>
              <FileUploader
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                progress={uploadProgress}
                acceptedTypes=".pdf,.docx,.txt"
              />
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep('source')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handleDocumentsSubmit}
                  disabled={uploadedFiles.length === 0}
                  className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-8"
            >
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                Agent Settings
              </h2>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Agent Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={agentSettings.name}
                    onChange={(e) =>
                      setAgentSettings({
                        ...agentSettings,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                    placeholder="My AI Agent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prompt"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Persona Prompt
                  </label>
                  <textarea
                    id="prompt"
                    rows={4}
                    value={agentSettings.personaPrompt}
                    onChange={(e) =>
                      setAgentSettings({
                        ...agentSettings,
                        personaPrompt: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                    placeholder="You are a helpful AI assistant..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="domains"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Allowed Domains (comma-separated)
                  </label>
                  <input
                    id="domains"
                    type="text"
                    value={agentSettings.allowedDomains.join(', ')}
                    onChange={(e) =>
                      setAgentSettings({
                        ...agentSettings,
                        allowedDomains: e.target.value
                          .split(',')
                          .map((d) => d.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                    placeholder="example.com, app.example.com"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id="isPublic"
                    type="checkbox"
                    checked={agentSettings.isPublic}
                    onChange={(e) =>
                      setAgentSettings({
                        ...agentSettings,
                        isPublic: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isPublic"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Make agent publicly accessible
                  </label>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('configure')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('finalize')}
                    className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'finalize' && (
            <motion.div
              key="finalize"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-8"
            >
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                Review & Create
              </h2>
              <div className="space-y-4 mb-6">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Agent Name:
                  </span>
                  <p className="text-gray-900 dark:text-white">{agentSettings.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Source Type:
                  </span>
                  <p className="text-gray-900 dark:text-white capitalize">{sourceType}</p>
                </div>
                {sourceType === 'website' && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Website URL:
                    </span>
                    <p className="text-gray-900 dark:text-white">{websiteConfig.url}</p>
                  </div>
                )}
                {sourceType === 'documents' && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Documents:
                    </span>
                    <p className="text-gray-900 dark:text-white">
                      {uploadedFiles.length} file(s)
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('settings')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={loading}
                  className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

