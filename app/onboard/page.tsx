'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { httpGetOneUser, httpGetApps } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { OnboardWizard } from '@/components/OnboardWizard';
import { Header } from '@/components/Header';

export default function OnboardPage() {
  const router = useRouter();
  const { currentUser, doSetUser } = useAppStore();

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { data } = await httpGetOneUser();
        doSetUser({
          _id: data.user._id,
          appId: data.user.appId,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          homeScreen: data.user.homeScreen || '',
          isAgreeWithTerms: data.user.isAgreeWithTerms || false,
          isAssetsOpen: data.user.isAssetsOpen || false,
          isProfileOpen: data.user.isProfileOpen || false,
          token: '', // Will be set by auth
          refreshToken: '',
          wsToken: '',
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
      } catch (error: any) {
        // Only redirect to login on authentication errors (401)
        if (error?.response?.status === 401) {
          router.push('/login');
        } else {
          // Other errors - log but don't auto-logout
          console.error('Non-auth error during auth check:', error?.response?.data || error?.message);
        }
      }
    };

    checkAuth();
  }, [router, doSetUser]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <OnboardWizard />
    </div>
  );
}

