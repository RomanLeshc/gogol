import { useEffect, useState } from 'react';

interface CreationProgressProps {
  isCreating: boolean;
  currentStep: 'creating' | 'indexing-websites' | 'uploading-documents' | 'finalizing' | 'complete';
  websiteCount?: number;
  documentCount?: number;
}

export function CreationProgress({ 
  isCreating, 
  currentStep, 
  websiteCount = 0, 
  documentCount = 0 
}: CreationProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isCreating) {
      setProgress(0);
      return;
    }

    // Calculate progress based on current step
    const stepProgress: Record<typeof currentStep, number> = {
      'creating': 25,
      'indexing-websites': 50,
      'uploading-documents': 75,
      'finalizing': 90,
      'complete': 100,
    };

    const targetProgress = stepProgress[currentStep];
    
    // Animate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= targetProgress) {
          clearInterval(interval);
          return targetProgress;
        }
        return Math.min(prev + 2, targetProgress);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isCreating, currentStep]);

  if (!isCreating) return null;

  const stepMessages: Record<typeof currentStep, string> = {
    'creating': 'Creating your AI agent...',
    'indexing-websites': `Indexing ${websiteCount} website${websiteCount !== 1 ? 's' : ''}...`,
    'uploading-documents': `Uploading ${documentCount} document${documentCount !== 1 ? 's' : ''}...`,
    'finalizing': 'Finalizing setup...',
    'complete': 'Agent created successfully!',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {stepMessages[currentStep]}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please wait while we set up your agent
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full w-full bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Step indicators */}
        <div className="mt-6 space-y-2">
          {[
            { key: 'creating', label: 'Creating agent' },
            { key: 'indexing-websites', label: 'Indexing websites', show: websiteCount > 0 },
            { key: 'uploading-documents', label: 'Uploading documents', show: documentCount > 0 },
            { key: 'finalizing', label: 'Finalizing' },
          ].map(({ key, label, show = true }) => {
            if (!show) return null;
            
            const stepIndex = ['creating', 'indexing-websites', 'uploading-documents', 'finalizing'].indexOf(key);
            const currentIndex = ['creating', 'indexing-websites', 'uploading-documents', 'finalizing'].indexOf(currentStep);
            const isComplete = currentIndex > stepIndex;
            const isCurrent = currentStep === key;

            return (
              <div key={key} className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isComplete
                      ? 'bg-green-500'
                      : isCurrent
                      ? 'bg-brand-500 animate-pulse'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  {isComplete && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    isComplete || isCurrent
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
