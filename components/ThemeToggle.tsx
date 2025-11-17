'use client';

import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes: Array<{ value: 'light' | 'dark' | 'system'; label: string }> = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            theme === t.value
              ? 'text-brand-600 dark:text-brand-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {theme === t.value && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

