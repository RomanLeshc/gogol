import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { httpGetApp, httpGetOneUser } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { ModelApp } from '@/lib/types';

export function useAgentData(agentId: string) {
  const router = useRouter();
  const { doSetUser, doSetCurrentApp } = useAppStore();
  const [app, setApp] = useState<ModelApp | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAgent = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
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

      const { data: appData } = await httpGetApp(agentId);
      setApp(appData.result);
      doSetCurrentApp(appData.result);
    } catch (error: any) {
      console.error('Failed to load agent:', error);
      if (error?.response?.status === 401) {
        router.push('/login');
      } else {
        router.push('/agents');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (agentId) {
      loadAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  return { app, loading, loadAgent, setApp };
}

