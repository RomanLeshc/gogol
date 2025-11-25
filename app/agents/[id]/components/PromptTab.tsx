'use client';

import { ModelApp } from "@/lib/types";
import { Textarea } from "@headlessui/react";
import { useEffect, useState } from "react";

interface PromptTabProps {
    loading: boolean;
    onUpdate: (updates: Partial<ModelApp>) => void;
    app: ModelApp;
}

export function PromptTab({ loading, onUpdate, app }: PromptTabProps) {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    setPrompt(app.aiBot.prompt);
  }, [app.aiBot.prompt]);

  const handleUpdatePrompt = () => {
    onUpdate({ botPrompt: prompt });
  };
      
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Prompt
        </h2>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <p className="font-sans text-sm pb-4 flex items-center gap-1">
          Use to provide instructions on how the bot should behave. You may also
          copy&paste limited data on your specific business context the bot should
          be aware of.
        </p>
      </div>
      <Textarea
        className="rounded-xl border outline-none w-full p-4 h-[196px] dark:bg-gray-900 text-gray-500 border-gray-500 mb-8"
        placeholder="Enter prompt instructions here..."
        value={prompt}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
      />

        <button
            type="button"
            onClick={handleUpdatePrompt}
            disabled={!prompt.trim() || loading}
            className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Indexing...
              </>
            ) : (
              'Start Indexing'
            )}
          </button>
    </div>
  );
}