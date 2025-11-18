/**
 * App Configuration
 * Fetches app config and sets appJwt token for API requests
 * This must be called before any API requests that require appJwt
 */

import { httpGetConfig, httpTokens } from './api';

export async function initializeAppConfig(domainName?: string) {
  try {
    console.log('🔍 Fetching app config with domainName:', domainName || 'none');
    
    const response = await httpGetConfig(domainName);
    console.log('📦 Config response data keys:', Object.keys(response.data || {}));
    
    const data = response.data;
    const result = data?.result || data;
    
    console.log('📦 Result keys:', result ? Object.keys(result) : 'no result');
    console.log('📦 Result.appToken exists:', !!result?.appToken);
    
    // Set appJwt token (required for whitelisted endpoints like /users/login-with-email)
    // The appToken from the config is the JWT that should be used for app-level requests
    if (!result) {
      console.error('❌ No result in response:', data);
      throw new Error('No result in config response');
    }
    
    if (!result.appToken) {
      console.error('❌ appToken not found in result:', result);
      console.error('❌ Available keys:', Object.keys(result));
      throw new Error('appToken not found in config response. Available keys: ' + Object.keys(result).join(', '));
    }
    
    // CRITICAL: Set the appJwt token
    // NOTE: appToken already includes "JWT " prefix from the API
    httpTokens.appJwt = result.appToken;
    
    // Verify it was set
    if (!httpTokens.appJwt) {
      throw new Error('Failed to set appJwt token');
    }
    
    // Verify it's not empty
    if (httpTokens.appJwt.trim().length === 0) {
      throw new Error('appJwt token is empty');
    }
    
    console.log('✅ App config initialized');
    console.log('✅ appJwt set successfully, length:', httpTokens.appJwt.length);
    console.log('✅ appJwt preview:', httpTokens.appJwt.substring(0, 60) + '...');
    console.log('✅ appJwt starts with JWT:', httpTokens.appJwt.startsWith('JWT '));
    
    return result;
  } catch (error: any) {
    console.error('❌ Failed to initialize app config');
    console.error('❌ Error:', error.message);
    console.error('❌ Response data:', error.response?.data);
    console.error('❌ Response status:', error.response?.status);
    console.error('❌ Full error:', error);
    throw error;
  }
}

