import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { httpGetOneUser, httpGetUserStats, httpGetUserRestrictions, handleApiError } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { UserStats, UserRestrictions } from '@/lib/types';
import { toast } from 'react-toastify';

export function useStatsData() {
  const router = useRouter();
  const { doSetUser } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [restrictions, setRestrictions] = useState<UserRestrictions | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: userData } = await httpGetOneUser();
        if (userData && userData.user) {
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
        } else {
          router.push('/login');
          return;
        }

        const [statsResponse, restrictionsResponse] = await Promise.all([
          httpGetUserStats(),
          httpGetUserRestrictions(),
        ]);

        setStats(statsResponse.data.stats);
        setRestrictions(restrictionsResponse.data.restrictions);
      } catch (error: any) {
        console.error('Failed to load stats:', error);
        const apiError = handleApiError(error);

        if (error?.response?.status === 401) {
          router.push('/login');
        } else {
          toast.error(
            apiError.message || 'Failed to load statistics. Please try again.'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, doSetUser]);

  return { loading, stats, restrictions };
}

