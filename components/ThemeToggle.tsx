'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes: Array<{ value: 'light' | 'dark' | 'system'; label: string; icon: JSX.Element }> = [
    { 
      value: 'light', 
      label: 'Light',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )
    },
    { 
      value: 'dark', 
      label: 'Dark',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )
    },
    { 
      value: 'system', 
      label: 'System',
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )
    },
  ];

  // Icon based on current theme
  const getThemeIcon = () => {
    if (theme === 'system') {
      return themes[2].icon;
    }
    
    if (resolvedTheme === 'dark') {
      return themes[1].icon;
    }
    
    return themes[0].icon;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeSelect = (themeValue: 'light' | 'dark' | 'system') => {
    setTheme(themeValue);
    setIsOpen(false);
  };

  // Determine dropdown background color based on resolved theme
  const dropdownBgColor = resolvedTheme === 'dark' 
    ? 'bg-gray-900' 
    : 'bg-white';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        aria-label="Select theme"
      >
        <span className="text-gray-600 dark:text-gray-400">
          {getThemeIcon()}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Arrow pointing to icon */}
          <div
            className={`absolute top-full right-0 mr-[10px] mt-1 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent ${resolvedTheme === 'dark' ? 'border-b-gray-900' : 'border-b-gray-800'} z-10`}
          />
          
          {/* Dropdown menu */}
          <div
            className={`absolute top-full right-0 mt-2 ${dropdownBgColor} rounded-lg shadow-lg z-10 min-w-[140px]`}
          >
            <div className="py-[7px]">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleThemeSelect(t.value)}
                  className={`w-full px-4 py-2 text-sm text-gray-900 dark:text-white flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    theme === t.value ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                >
                  <span className="text-gray-900 dark:text-white">{t.icon}</span>
                  <span className="text-gray-900 dark:text-white">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

