'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  httpCreateNewApp,
  setSourcesSiteCrawl,
  httpPostFile,
  postDocument,
  setSourcesSiteFiles,
} from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { Files } from '@/lib/types';
import { toast } from 'react-toastify';
import { FileUploader } from './FileUploader';
import { UrlInput } from './UrlInput';
import { CreationProgress } from './CreationProgress';
import { saveWizardData, loadWizardData, clearWizardData } from '@/lib/onboardStorage';

type Step = 'sources' | 'add-website' | 'add-documents' | 'settings' | 'finalize';
type CreationStep = 'creating' | 'indexing-websites' | 'uploading-documents' | 'finalizing' | 'complete';


interface WebsiteSource {
  url: string;
  followLink: boolean;
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
  const [step, setStep] = useState<Step>('sources');
  const [loading, setLoading] = useState(false);
  const [creationStep, setCreationStep] = useState<CreationStep>('creating');
  
  // Multiple website sources
  const [websiteSources, setWebsiteSources] = useState<WebsiteSource[]>([]);
  const [currentWebsiteUrl, setCurrentWebsiteUrl] = useState('');
  const [currentFollowLink, setCurrentFollowLink] = useState(true);
  
  // Document upload - use Files[] internally, convert to File[] only when needed
  const [uploadedFiles, setUploadedFiles] = useState<Files[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  // Agent settings
  const [agentSettings, setAgentSettings] = useState<AgentSettings>({
    name: '',
    personaPrompt: 'You are a helpful AI assistant.',
    allowedDomains: [],
    isPublic: false,
  });

  // Track if component is initialized to prevent saving during initial load
  const isInitialized = useRef(false);
  const isSavingRef = useRef(false);

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadWizardData();
    if (savedData) {
      setStep(savedData.step);
      setWebsiteSources(savedData.websiteSources);
      setCurrentWebsiteUrl(savedData.currentWebsiteUrl);
      setCurrentFollowLink(savedData.currentFollowLink);
      // Convert File[] to Files[] for internal state
      const filesAsFiles: Files[] = savedData.uploadedFiles.map((file) => ({
        id: `saved-${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
        md: '',
        mdByteSize: file.size,
        url: file.name,
        file: file,
      }));
      setUploadedFiles(filesAsFiles);
      setAgentSettings(savedData.agentSettings);
    }
    isInitialized.current = true;
  }, []);

  // Save data whenever it changes (debounced)
  // useEffect(() => {
  //   if (!isInitialized.current || isSavingRef.current) return;

  //   const timeoutId = setTimeout(async () => {
  //     isSavingRef.current = true;
  //     // Convert Files[] to File[] for saving
  //     const filesAsFileArray = uploadedFiles.map((f) => f.file!).filter(Boolean);
  //     await saveWizardData({
  //       step,
  //       websiteSources,
  //       uploadedFiles: filesAsFileArray,
  //       agentSettings,
  //       currentWebsiteUrl,
  //       currentFollowLink,
  //     });
  //     isSavingRef.current = false;
  //   }, 500); // Debounce saves by 500ms

  //   return () => {
  //     clearTimeout(timeoutId);
  //   };
  // }, [step, websiteSources, uploadedFiles, agentSettings, currentWebsiteUrl, currentFollowLink]);


  const handleAddWebsite = () => {
    if (!currentWebsiteUrl.trim()) {
      toast.error('Please enter a website URL');
      return;
    }
    
    setWebsiteSources([...websiteSources, {
      url: currentWebsiteUrl.trim(),
      followLink: currentFollowLink,
    }]);
    setCurrentWebsiteUrl('');
    setCurrentFollowLink(true);
    toast.success('Website added');
  };

  const handleRemoveWebsite = (index: number) => {
    setWebsiteSources(websiteSources.filter((_, i) => i !== index));
  };

  const handleContinueFromSources = () => {
    // If nothing added, go to settings. Otherwise, show what was added and allow continuing
    if (websiteSources.length === 0 && uploadedFiles.length === 0) {
      setStep('settings');
    } else {
      setStep('settings');
    }
  };

  const handleFinalize = async () => {
    if (!agentSettings.name) {
      toast.error('Please enter an agent name');
      return;
    }

    setLoading(true);
    setCreationStep('creating');

    try {
      // Step 1: Create the app/agent
      const { data: appData } = await httpCreateNewApp(agentSettings.name);
      const appId = appData.app._id;

      // Step 2: Add website sources (if any)
      if (websiteSources.length > 0) {
        setCreationStep('indexing-websites');
        const websitePromises = websiteSources.map((source) =>
          setSourcesSiteCrawl(appId, source.url, source.followLink)
        );
        await Promise.all(websitePromises);
        toast.success(`${websiteSources.length} website(s) indexing started`);
      }

      // Step 3: Upload documents (if any)
      if (uploadedFiles.length > 0) {
        setCreationStep('uploading-documents');
        try {
          // Convert Files[] to File[] for API call
          const filesToUpload = uploadedFiles.map((f) => f.file!).filter(Boolean);
          await setSourcesSiteFiles(appId, filesToUpload);
          toast.success(`${filesToUpload.length} document(s) uploaded successfully`);
        } catch (error) {
          console.error(`Failed to upload files:`, error);
          throw error;
        }
      }
      
      // Step 4: Finalize
      setCreationStep('finalizing');
      
      // If no sources added, that's fine - user can add them later!

      // Step 3: Update app with agent settings if provided
      // Note: The API might need additional endpoints for updating agent-specific settings
      // For now, we'll use the standard app update endpoint
      // await httpUpdateApp(appId, {
      //   aiBot: {
      //     prompt: agentSettings.personaPrompt,
      //     isRAG: sourceType !== null, // Enable RAG if sources were added
      //     status: 'on',
      //   },
      // });

      // Small delay to show finalizing step
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCreationStep('complete');
      doAddApp(appData.app);
      toast.success('Agent created successfully!');
      
      // Clear saved wizard data after successful creation
      clearWizardData();
      
      // Small delay before redirect to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to agent detail page with overview tab open
      router.push(`/agents/${appId}#overview`);
    } catch (error: any) {
      console.error('Agent creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <CreationProgress
        isCreating={loading}
        currentStep={creationStep}
        websiteCount={websiteSources.length}
        documentCount={uploadedFiles.length}
      />
      
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
            {(['sources', 'settings', 'finalize'] as Step[]).map(
              (s, index) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step === s
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : ['sources', 'settings', 'finalize'].indexOf(step) > index
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < 2 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        ['sources', 'settings', 'finalize'].indexOf(step) > index
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
          {step === 'sources' && (
            <motion.div
              key="sources"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-8"
            >
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                Add Knowledge Sources
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Add website URLs and/or documents to train your AI agent. You can add both, one, or skip and add later.
              </p>

              {/* Website Sources Section */}
              <div className="mb-8 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Website Indexing
                </h3>
                <div className="flex gap-2">
                  <UrlInput
                    value={currentWebsiteUrl}
                    onChange={setCurrentWebsiteUrl}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-brand-500 focus:border-brand-500"
                    placeholder="https://example.com"
                  />
                  <button
                    onClick={handleAddWebsite}
                    disabled={!currentWebsiteUrl.trim()}
                    className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Add
                  </button>
                </div>

                <div className="flex items-center justify-start px-3">
                  <input
                    id="follow-link-check"
                    type="checkbox"
                    checked={currentFollowLink}
                    onChange={(e) => setCurrentFollowLink(e.target.checked)}
                    className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-gray-300 rounded"
                  />
                  <label htmlFor="follow-link-check" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Follow links
                  </label>
                </div>

                {websiteSources.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {websiteSources.map((source, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {source.url}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {source.followLink ? 'Follows links' : 'Single page'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveWebsite(index)}
                          className="text-red-500 hover:text-red-700 transition-all duration-200 hover:scale-110 active:scale-95"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents Section */}
              <div className="mb-8 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Documents
                </h3>
                <FileUploader
                  files={uploadedFiles}
                  onFilesChange={(files: File[]) => {
                    // Convert File[] to Files[] for internal state
                    const filesAsFiles: Files[] = files.map((file) => ({
                      id: `new-${Date.now()}-${Math.random()}`,
                      createdAt: new Date().toISOString(),
                      md: '',
                      mdByteSize: file.size,
                      url: file.name,
                      file: file,
                    }));
                    setUploadedFiles(filesAsFiles);
                  }}
                  progress={uploadProgress}
                  acceptedTypes=".pdf,.docx,.txt"
                />
              </div>

              {/* Summary */}
              {(websiteSources.length > 0 || uploadedFiles.length > 0) && (
                <div className="mb-6 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                  <p className="text-sm text-brand-800 dark:text-brand-200">
                    <strong>Added:</strong> {websiteSources.length} website(s), {uploadedFiles.length} document(s)
                  </p>
                </div>
              )}

              {/* Continue Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleContinueFromSources}
                  className="px-6 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Continue to Settings
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
                    onClick={() => setStep('sources')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('finalize')}
                    className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-all duration-200 hover:scale-105 active:scale-95"
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
                    Knowledge Sources:
                  </span>
                  <div className="mt-1 space-y-1">
                    {websiteSources.length > 0 && (
                      <p className="text-gray-900 dark:text-white">
                        {websiteSources.length} website(s): {websiteSources.map(s => s.url).join(', ')}
                      </p>
                    )}
                    {uploadedFiles.length > 0 && (
                      <p className="text-gray-900 dark:text-white">
                        {uploadedFiles.length} document(s): {uploadedFiles.map(f => f.url || f.file?.name || 'Unknown').join(', ')}
                      </p>
                    )}
                    {websiteSources.length === 0 && uploadedFiles.length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 italic">
                        No sources added (you can add them later)
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('settings')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Back
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={loading}
                  className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {loading ? 'Creating...' : 'Create Agent'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}

