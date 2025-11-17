'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { httpTokens, httpGetOneUser } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'react-toastify';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { doSetUser } = useAppStore();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        toast.error('Invalid callback token');
        router.push('/login');
        return;
      }

      try {
        // Store token from callback
        httpTokens.token = token;
        
        // Fetch user data
        const { data } = await httpGetOneUser();
        
        if (!data || !data.user) {
          throw new Error('Invalid user data received');
        }
        
        // Store refresh token and wsToken if provided (they might be in user object or data root)
        if (data.user.refreshToken) {
          httpTokens.refreshToken = data.user.refreshToken;
        } else if (data.refreshToken) {
          httpTokens.refreshToken = data.refreshToken;
        }
        if (data.user.wsToken) {
          httpTokens.wsToken = data.user.wsToken;
        } else if (data.wsToken) {
          httpTokens.wsToken = data.wsToken;
        }
        
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
          token: data.user.token || httpTokens.token,
          refreshToken: data.user.refreshToken || httpTokens.refreshToken,
          wsToken: data.user.wsToken || httpTokens.wsToken,
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

        toast.success('Authentication successful!');
        
        // Redirect to home (which will check for onboarding)
        router.push('/');
      } catch (error: any) {
        console.error('Callback error:', error);
        toast.error('Authentication failed');
        router.push('/login');
      }
    };

    handleCallback();
  }, [searchParams, router, doSetUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Completing authentication...</p>
      </div>
    </div>
  );
}

