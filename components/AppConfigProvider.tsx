'use client';

import { useEffect, useState } from 'react';
import { initializeAppConfig } from '@/lib/appConfig';
import { httpTokens } from '@/lib/api';
import { Loading } from './Loading';

interface AppConfigProviderProps {
  children: React.ReactNode;
}

export function AppConfigProvider({ children }: AppConfigProviderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Use domain name from env, default to 'app' (matches original app)
        const domainName = process.env.NEXT_PUBLIC_DOMAIN_NAME || 'app';
        console.log('Loading app config with domainName:', domainName);
        
        await initializeAppConfig(domainName);
        
        // Verify appJwt was set and is not empty
        if (!httpTokens.appJwt || httpTokens.appJwt.trim().length === 0) {
          console.error('❌ httpTokens after config load:', httpTokens);
          console.error('❌ appJwt value:', httpTokens.appJwt);
          throw new Error('appJwt was not set or is empty after config load');
        }
        
        // Verify appJwt has the correct format (should start with "JWT ")
        if (!httpTokens.appJwt.startsWith('JWT ')) {
          console.warn('⚠️ appJwt does not start with "JWT ", adding prefix');
          httpTokens.appJwt = `JWT ${httpTokens.appJwt}`;
        }
        
        console.log('✅ App config loaded successfully');
        console.log('✅ appJwt set:', httpTokens.appJwt.substring(0, 60) + '...');
        console.log('✅ appJwt length:', httpTokens.appJwt.length);
        console.log('✅ appJwt starts with JWT:', httpTokens.appJwt.startsWith('JWT '));
        setConfigLoaded(true);
        setLoading(false);
      } catch (err: any) {
        console.error('❌ Failed to load app config:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        setError(err.message || 'Failed to load app configuration');
        // CRITICAL: Don't allow app to continue without appJwt
        // Login/register will fail without it
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error || !configLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Configuration Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {error || 'Failed to load app configuration'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Please refresh the page or contact support.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

