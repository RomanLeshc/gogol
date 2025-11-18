'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { httpLoginWithEmail, httpLoginSocial, httpTokens } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { doSetUser } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [appJwtReady, setAppJwtReady] = useState(false);

  // Ensure appJwt is loaded before allowing login
  useEffect(() => {
    // Check if appJwt is already set
    if (httpTokens.appJwt) {
      setAppJwtReady(true);
      return;
    }

    // Poll for appJwt (in case AppConfigProvider is still loading)
    const checkInterval = setInterval(() => {
      if (httpTokens.appJwt) {
        setAppJwtReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!httpTokens.appJwt) {
        toast.error('App configuration not loaded. Please refresh the page.');
      } else {
        setAppJwtReady(true);
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CRITICAL: Verify appJwt is set before making request
    if (!httpTokens.appJwt) {
      toast.error('App configuration not loaded. Please wait or refresh the page.');
      return;
    }

    setLoading(true);

    try {
      // Log the request details for debugging
      console.log('Making login request with appJwt:', httpTokens.appJwt.substring(0, 30) + '...');
      const { data } = await httpLoginWithEmail(email, password);
      
      // Store tokens (mirrors original app's behavior)
      httpTokens.token = data.token;
      httpTokens.refreshToken = data.refreshToken;
      httpTokens.wsToken = data.wsToken;
      
      // Set user in store
      doSetUser({
        _id: data.user._id,
        appId: data.user.appId,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        homeScreen: data.user.homeScreen || '',
        isAgreeWithTerms: data.user.isAgreeWithTerms || false,
        isAssetsOpen: data.user.isAssetsOpen || false,
        isProfileOpen: data.user.isProfileOpen || false,
        token: data.token,
        refreshToken: data.refreshToken,
        wsToken: data.wsToken,
        walletAddress: data.user.defaultWallet?.walletAddress || '',
        xmppPassword: data.user.xmppPassword || '',
        xmppUsername: data.user.xmppUsername || '',
        profileImage: data.user.profileImage || '',
        description: data.user.description || '',
        defaultWallet: {
          walletAddress: data.user.defaultWallet?.walletAddress || '',
        },
        email: data.user.email,
        orgId: data.user.orgId,
        theme: data.user.theme as 'light' | 'dark' | 'system' | undefined,
      });

      toast.success('Login successful!');
      
      // Check if user needs onboarding
      router.push('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    setLoading(true);
    // Note: This is a simplified version. In production, you'd integrate with
    // the actual OAuth providers (Google, Apple, Facebook)
    toast.info(`${provider} login integration needed`);
    setLoading(false);
  };

  if (!appJwtReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleEmailLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/register"
              className="text-sm text-brand-600 hover:text-brand-500 transition-all duration-200 hover:scale-105"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Google
            </button>
            <button
              onClick={() => handleSocialLogin('apple')}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Apple
            </button>
            <button
              onClick={() => handleSocialLogin('facebook')}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

