import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { httpGetApps, httpGetOneUser } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { ModelApp } from '@/lib/types';

export function useAdminData() {
  const router = useRouter();
  const { doSetUser, doSetApps } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ModelApp | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: userData } = await httpGetOneUser();
        doSetUser({
          _id: userData.user._id,
          appId: userData.user.appId,
          firstName: userData.user.firstName,
          lastName: userData.user.lastName,
          homeScreen: userData.user.homeScreen || '',
          isAgreeWithTerms: userData.user.isAgreeWithTerms || false,
          isAssetsOpen: userData.user.isAssetsOpen || false,
          isProfileOpen: userData.user.isProfileOpen || false,
          token: '',
          refreshToken: '',
          wsToken: '',
          walletAddress: userData.user.defaultWallet?.walletAddress || '',
          xmppPassword: userData.user.xmppPassword || '',
          xmppUsername: userData.user.xmppUsername || '',
          profileImage: userData.user.profileImage || '',
          description: userData.user.description || '',
          defaultWallet: {
            walletAddress: userData.user.defaultWallet?.walletAddress || '',
          },
          email: userData.user.email,
          orgId: userData.user.orgId,
          theme: userData.user.theme as 'light' | 'dark' | 'system' | undefined,
        });

        const { data: appsData } = await httpGetApps({});
        doSetApps(appsData.apps || []);

        if (appsData.apps && appsData.apps.length > 0) {
          setSelectedApp(appsData.apps[0]);
        }
      } catch (error: any) {
        console.error('Failed to load data:', error);
        if (error?.response?.status === 401) {
          router.push('/login');
        } else {
          console.error('Non-auth error during data load:', error?.response?.data || error?.message);
          doSetApps([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, doSetUser, doSetApps]);

  return { loading, selectedApp, setSelectedApp };
}

