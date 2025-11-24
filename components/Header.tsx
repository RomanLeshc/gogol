'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { httpLogout } from '@/lib/api';
import { ThemeToggle } from './ThemeToggle';
import { LogoutModal } from './LogoutModal';

export function Header() {
  const router = useRouter();
  const { currentUser, doClearState } = useAppStore();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await httpLogout();
      doClearState();
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state anyway
      doClearState();
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      router.push('/login');
    }
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Gogol Agents
            </div>
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />
            
            {currentUser && (
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105"
                >
                  Agents
                </Link>
                <Link
                  href="/stats"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105"
                >
                  Stats
                </Link>
                <Link
                  href="/admin/simple"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105"
                >
                  Admin
                </Link>
                <Link
                  href="/embed"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105"
                >
                  Embed
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {currentUser && (
              <>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentUser.firstName} {currentUser.lastName}
                  </span>
                  
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />

                  <ThemeToggle />
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />

                  <button
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105 active:scale-95">
                      Logout
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </header>
  );
}

