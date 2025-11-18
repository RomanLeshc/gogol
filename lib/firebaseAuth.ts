/**
 * Firebase Authentication Integration
 * Handles Google SSO authentication flow with backend API
 */

import { signInWithGoogle } from './firebase';
import { httpLoginSocial, httpRegisterSocial, httpTokens } from './api';
import { useAppStore } from './store';
import { toast } from 'react-toastify';

/**
 * Handle Google sign-in for existing users (login)
 */
export async function handleGoogleLogin() {
  try {
    // Ensure Firebase is initialized before attempting sign-in
    const { ensureFirebaseInitialized, isFirebaseInitialized } = await import('./firebase');
    
    if (!isFirebaseInitialized()) {
      console.log('⚠️ Firebase not initialized, attempting to initialize...');
      const initialized = await ensureFirebaseInitialized();
      
      if (!initialized) {
        const { useAppStore } = await import('./store');
        const currentApp = useAppStore.getState().currentApp;
        
        if (!currentApp) {
          throw new Error('App configuration not loaded. Please wait for the app to finish loading and try again.');
        }
        
        if (!currentApp.firebaseWebConfigString && !currentApp.firebaseConfigParsed) {
          throw new Error('Firebase configuration is not available in app config. Please contact support.');
        }
        
        throw new Error('Failed to initialize Firebase. Please refresh the page and try again.');
      }
    }

    // Sign in with Google via Firebase
    const firebaseResult = await signInWithGoogle();
    
    if (!firebaseResult) {
      throw new Error('Failed to get authentication result from Google');
    }

    const { idToken, accessToken } = firebaseResult;

    // Call backend login endpoint
    const { data } = await httpLoginSocial(
      idToken,
      accessToken,
      'google',
      'authToken'
    );

    // Store tokens
    httpTokens.token = data.token;
    httpTokens.refreshToken = data.refreshToken;
    httpTokens.wsToken = data.wsToken;

    // Set user in store
    const { doSetUser } = useAppStore.getState();
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
    return data;
  } catch (error: any) {
    console.error('Google login error:', error);
    
    // Handle specific error messages
    if (error.message?.includes('popup')) {
      toast.error(error.message);
    } else if (error.response?.status === 404) {
      // User doesn't exist, might need to register
      throw new Error('USER_NOT_FOUND');
    } else {
      toast.error(error.response?.data?.message || 'Google login failed. Please try again.');
    }
    throw error;
  }
}

/**
 * Handle Google sign-up for new users (register)
 */
export async function handleGoogleRegister(signUpPlan?: string, utm?: string) {
  try {
    // Ensure Firebase is initialized before attempting sign-in
    const { ensureFirebaseInitialized, isFirebaseInitialized } = await import('./firebase');
    
    if (!isFirebaseInitialized()) {
      console.log('⚠️ Firebase not initialized, attempting to initialize...');
      const initialized = await ensureFirebaseInitialized();
      
      if (!initialized) {
        const { useAppStore } = await import('./store');
        const currentApp = useAppStore.getState().currentApp;
        
        if (!currentApp) {
          throw new Error('App configuration not loaded. Please wait for the app to finish loading and try again.');
        }
        
        if (!currentApp.firebaseWebConfigString && !currentApp.firebaseConfigParsed) {
          throw new Error('Firebase configuration is not available in app config. Please contact support.');
        }
        
        throw new Error('Failed to initialize Firebase. Please refresh the page and try again.');
      }
    }

    // Sign in with Google via Firebase
    const firebaseResult = await signInWithGoogle();
    
    if (!firebaseResult) {
      throw new Error('Failed to get authentication result from Google');
    }

    const { idToken, accessToken } = firebaseResult;

    // Call backend register endpoint
    const { data } = await httpRegisterSocial(
      idToken,
      accessToken,
      'authToken',
      'google',
      signUpPlan,
      utm
    );

    // Store tokens
    httpTokens.token = data.token;
    httpTokens.refreshToken = data.refreshToken;
    httpTokens.wsToken = data.wsToken;

    // Set user in store
    const { doSetUser } = useAppStore.getState();
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

    toast.success('Registration successful!');
    return data;
  } catch (error: any) {
    console.error('Google registration error:', error);
    
    // Handle specific error messages
    if (error.message?.includes('popup')) {
      toast.error(error.message);
    } else {
      toast.error(error.response?.data?.message || 'Google registration failed. Please try again.');
    }
    throw error;
  }
}

