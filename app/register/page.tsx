'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { httpRegisterWithEmailV2, httpLoginWithEmail, httpTokens } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { doSetUser } = useAppStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [cfToken, setCfToken] = useState(''); // Cloudflare Turnstile token

  // Get UTM params from URL or localStorage
  const getUtmParams = () => {
    if (typeof window === 'undefined') return undefined;
    const utmParams = localStorage.getItem('urlParams');
    if (utmParams) {
      try {
        const params = JSON.parse(utmParams);
        return params.utm || undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const utm = getUtmParams();
      const signUpPlan = searchParams.get('plan') || undefined;

      // Register using V2 endpoint
      const { data: registerData } = await httpRegisterWithEmailV2(
        formData.email,
        formData.password,
        cfToken || 'cf-token-placeholder', // Cloudflare token - in production, use actual Turnstile
        formData.firstName,
        formData.lastName,
        utm,
        signUpPlan
      );

      console.log('✅ Registration successful, attempting auto-login...');

      // Auto-login after successful registration using V1 endpoint
      const { data: loginData } = await httpLoginWithEmail(
        formData.email,
        formData.password
      );

      // Set tokens from login response
      httpTokens.token = loginData.token;
      httpTokens.refreshToken = loginData.refreshToken;
      httpTokens.wsToken = loginData.wsToken;

      // Set user data in store
      doSetUser({
        _id: loginData.user._id,
        appId: loginData.user.appId,
        firstName: loginData.user.firstName,
        lastName: loginData.user.lastName,
        homeScreen: loginData.user.homeScreen || '',
        isAgreeWithTerms: loginData.user.isAgreeWithTerms || false,
        isAssetsOpen: loginData.user.isAssetsOpen || false,
        isProfileOpen: loginData.user.isProfileOpen || false,
        token: loginData.token,
        refreshToken: loginData.refreshToken,
        wsToken: loginData.wsToken,
        walletAddress: loginData.user.defaultWallet?.walletAddress || '',
        xmppPassword: loginData.user.xmppPassword || '',
        xmppUsername: loginData.user.xmppUsername || '',
        profileImage: loginData.user.profileImage || '',
        description: loginData.user.description || '',
        defaultWallet: {
          walletAddress: loginData.user.defaultWallet?.walletAddress || '',
        },
        email: loginData.user.email,
        orgId: loginData.user.orgId,
        theme: loginData.user.theme as 'light' | 'dark' | 'system' | undefined,
      });

      toast.success('Registration successful! Logging you in...');
      router.push('/');
    } catch (error: any) {
      console.error('Registration/Login error:', error);
      
      // Check if registration succeeded but login failed
      if (error.config?.url?.includes('login-with-email')) {
        toast.error('Registration successful but auto-login failed. Please login manually.');
        router.push('/login');
      } else {
        toast.error(
          error.response?.data?.message ||
            error.response?.data?.error ||
            'Registration failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = async (provider: 'google' | 'apple' | 'facebook') => {
    if (provider !== 'google') {
      toast.info(`${provider} registration integration coming soon`);
      return;
    }

    setLoading(true);

    try {
      const { handleGoogleRegister } = await import('@/lib/firebaseAuth');
      const utm = getUtmParams();
      const signUpPlan = searchParams.get('plan') || undefined;
      
      await handleGoogleRegister(signUpPlan, utm);
      
      // Redirect to home (which will check for onboarding)
      router.push('/');
    } catch (error: any) {
      console.error('Social registration error:', error);
      // Error message already shown in handleGoogleRegister
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign up to get started with AI agents
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="sr-only">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>
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
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
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
                autoComplete="new-password"
                required
                minLength={8}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Password (min 8 characters)"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-brand-600 hover:text-brand-500 transition-all duration-200 hover:scale-105"
            >
              Already have an account? Sign in
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
              onClick={() => handleSocialRegister('google')}
              disabled={loading}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
              ) : (
                'Google'
              )}
            </button>
            <button
              onClick={() => handleSocialRegister('apple')}
              disabled={loading}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apple
            </button>
            <button
              onClick={() => handleSocialRegister('facebook')}
              disabled={loading}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

