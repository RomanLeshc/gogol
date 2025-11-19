/**
 * API Client Layer
 *
 * This file mirrors the exact API contracts from the original React app (src/http.ts).
 * All endpoints, request/response formats, and auth logic are preserved.
 *
 * ASSUMPTIONS:
 * - Backend API endpoints exist and match the original app's contracts
 * - Token storage uses localStorage keys: 'token-538' and 'refreshToken-538'
 * - Auth interceptors handle token refresh automatically
 *
 * @format
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { ModelApp } from "./types";

// Token storage mirrors original app's localStorage keys
const TOKEN_KEY = "token-538";
const REFRESH_TOKEN_KEY = "refreshToken-538";
const WS_TOKEN_KEY = "wsToken-538";

export const httpTokens = {
  appJwt: "",
  _token: "",
  _wsToken: "",
  _refreshToken: "",

  set refreshToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
    this._refreshToken = token;
  },

  get refreshToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem(REFRESH_TOKEN_KEY) || this._refreshToken;
    }
    return this._refreshToken;
  },

  set token(newToken: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, newToken);
    }
    this._token = newToken;
  },

  get token() {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY) || this._token;
    }
    return this._token;
  },

  set wsToken(wsToken: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(WS_TOKEN_KEY, wsToken);
    }
    this._wsToken = wsToken;
  },

  get wsToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem(WS_TOKEN_KEY) || this._wsToken;
    }
    return this._wsToken;
  },
};

// Initialize tokens from localStorage on client side
if (typeof window !== "undefined") {
  httpTokens.token = localStorage.getItem(TOKEN_KEY) || "";
  httpTokens.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || "";

  // Debug: Log initial state
  console.log("🔍 httpTokens initialized:", {
    hasToken: !!httpTokens.token,
    hasRefreshToken: !!httpTokens.refreshToken,
    hasAppJwt: !!httpTokens.appJwt,
  });
}

// Use NEXT_PUBLIC_API_V1 to match original app's VITE_API
const API_BASE =
  process.env.NEXT_PUBLIC_API_V1 ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://api.ethoradev.com/v1";
const API_V2_BASE =
  process.env.NEXT_PUBLIC_API_V2 || "https://api.ethoradev.com/v2";

export const http = axios.create({
  baseURL: API_BASE,
});

export const httpV2 = axios.create({
  baseURL: API_V2_BASE,
});

// Auth whitelist - endpoints that don't require auth token
const AUTH_WHITELIST: Array<string | RegExp> = [
  "/users/login-with-email",
  "/users/login",
  /^\/users\/checkEmail\//,
  "/users/sign-up-with-email",
  "/users/sign-up-resend-email",
  "/users/forgot",
  "/users/reset",
];

function isWhitelisted(url: string | undefined, method?: string): boolean {
  if (!url) return false;
  if (url === "/users" && method && method.toLowerCase() === "post") {
    return true;
  }
  return AUTH_WHITELIST.some((rule) => {
    if (typeof rule === "string") {
      return url === rule;
    }
    return (rule as RegExp).test(url);
  });
}

function attachAuthInterceptors(client: AxiosInstance) {
  // Request interceptor - attach auth token (matches original http.ts exactly)
  client.interceptors.request.use((config) => {
    if (config.url === "/users/login/refresh") {
      return config;
    }

    // Ensure headers object exists
    config.headers = config.headers || {};

    if (isWhitelisted(config.url, config.method)) {
      // Whitelisted endpoints use appJwt (app-level JWT token)
      // NOTE: appToken from API already includes "JWT " prefix (e.g., "JWT eyJhbGci...")
      const appJwt = httpTokens.appJwt || "";

      // CRITICAL: Always set Authorization header
      // The backend expects this header for whitelisted endpoints
      if (!appJwt || appJwt.trim().length === 0) {
        // If appJwt is not set yet, this is a CRITICAL ERROR
        console.error(
          "❌❌❌ CRITICAL: appJwt NOT SET! Request to:",
          config.url
        );
        console.error("❌ httpTokens.appJwt value:", httpTokens.appJwt);
        console.error("❌ httpTokens object:", httpTokens);
        throw new Error(
          `appJwt not initialized! Cannot make request to ${config.url}. Please refresh the page.`
        );
      }

      // Use appJwt as-is since it already includes "JWT " prefix from the API
      const authHeader = appJwt.trim();
      (config.headers as any).Authorization = authHeader;

      // Debug logging for login requests
      if (config.url === "/users/login-with-email") {
        console.log("🔐 LOGIN REQUEST INTERCEPTOR:");
        console.log("  ✅ URL:", config.url);
        console.log("  ✅ appJwt exists:", !!httpTokens.appJwt);
        console.log("  ✅ appJwt length:", httpTokens.appJwt?.length || 0);
        console.log(
          "  ✅ appJwt preview:",
          httpTokens.appJwt?.substring(0, 60) || "EMPTY"
        );
        console.log(
          "  ✅ Authorization header:",
          authHeader.substring(0, 60) + "..."
        );
        console.log("  ✅ Full Authorization length:", authHeader.length);
      }

      return config;
    }

    // All other endpoints use user token
    const userToken = httpTokens.token || "";
    (config.headers as any).Authorization = userToken.startsWith("JWT ")
      ? userToken
      : userToken
      ? `JWT ${userToken}`
      : "";
    return config;
  }, null);

  // Response interceptor - handle 401 and refresh token (matches original http.ts exactly)
  client.interceptors.response.use(null, async (error) => {
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    const request = error.config;
    const url = request.url;

    if (
      url === "/users/login/refresh" ||
      url === "/users/login-with-email" ||
      url === "/users/login"
    ) {
      return Promise.reject(error);
    }

    try {
      await refreshToken();
      return client(request);
    } catch (err) {
      // Refresh failed, redirect to login (matches original actionLogout behavior)
      if (typeof window !== "undefined") {
        localStorage.clear();
        window.location.pathname = "/login";
      }
      return Promise.reject(err);
    }
  });
}

attachAuthInterceptors(http);
attachAuthInterceptors(httpV2);

export const refreshToken = async () => {
  try {
    const response = await http.post("/users/login/refresh", null, {
      headers: {
        Authorization: httpTokens.refreshToken,
      },
    });
    const { token, refreshToken: refresh, wsToken } = response.data;
    httpTokens.token = token;
    httpTokens.refreshToken = refresh;
    httpTokens.wsToken = wsToken;

    return httpTokens;
  } catch (error) {
    // Clear tokens on refresh failure
    if (typeof window !== "undefined") {
      localStorage.clear();
      window.location.href = "/login";
    }
    console.error("Token refresh failed:", error);
    throw error;
  }
};

// ============ AUTH ENDPOINTS ============

export function httpLoginWithEmail(email: string, password: string) {
  return http.post("/users/login-with-email", { email, password });
}

export function httpLogout() {
  return http.post("/users/logout");
}

export function httpGetOneUser() {
  return http.get("/users/me");
}

export function httpGetOneUserWallet(wallet: string) {
  return http.get(`/users/profile/${wallet}`);
}

export const httpRegisterSocial = (
  idToken: string,
  accessToken: string,
  authToken: string,
  loginType: string,
  signUpPlan?: string,
  utm?: string
) => {
  return http.post("/users", {
    idToken,
    accessToken,
    loginType,
    authToken: authToken,
    signupPlan: signUpPlan,
    utm,
  });
};

export const httpLoginSocial = (
  idToken: string,
  accessToken: string,
  loginType: string,
  authToken: string = "authToken"
) => {
  return http.post(`/users/login`, {
    idToken,
    accessToken,
    loginType,
    authToken,
  });
};

export const httpRegisterWithEmail = (
  email: string,
  firstName: string,
  lastName: string,
  utm?: string,
  signUpPlan?: string
) => {
  const body = signUpPlan
    ? {
        email,
        firstName,
        lastName,
        signupPlan: signUpPlan,
        utm,
      }
    : {
        email,
        firstName,
        lastName,
        utm,
      };
  return http.post("/users/sign-up-with-email", body);
};

export const httpRegisterWithEmailV2 = (
  email: string,
  password: string,
  cfToken: string,
  firstName: string,
  lastName: string,
  utm?: string,
  signUpPlan?: string
) => {
  const body = signUpPlan
    ? {
        email,
        password,
        cfToken,
        firstName,
        lastName,
        signupPlan: signUpPlan,
        utm,
      }
    : {
        email,
        password,
        cfToken,
        firstName,
        lastName,
        utm,
      };
  return httpV2.post("/users/sign-up-with-email", body);
};

export async function httpResendLink(email: string) {
  return await http.post("/users/sign-up-resend-email", {
    email,
  });
}

export async function httpPostForgotPassword(email: string) {
  return await http.post("/users/forgot", {
    email,
  });
}

export async function httpResetPassword(token: string, password: string) {
  return await http.post("/users/reset", {
    token,
    password,
  });
}

export function httpUpdateUser(fd: FormData) {
  return http.put("/users", fd);
}

export function updateMe(data: any) {
  return http.put("/users", data);
}

// ============ APP/AGENT ENDPOINTS ============

export function httpGetConfig(domainName?: string) {
  let path = "/apps/get-config";
  if (domainName) {
    path += `?domainName=${domainName}`;
  }
  return http.get(path);
}

export function httpCreateNewApp(displayName: string) {
  return http.post(`/apps`, { displayName });
}

export interface GetAppsPaginator {
  limit?: number;
  offset?: number;
  order?: "asc" | "desc";
  orderBy?:
    | "createdAt"
    | "displayName"
    | "totalRegistered"
    | "totalSessions"
    | "totalApiCalls"
    | "totalFiles"
    | "totalTransactions"
    | "lastName"
    | "email"
    | "firstName";
}

export function httpGetApps({
  limit = 10,
  offset = 0,
  order = "asc",
  orderBy = "displayName",
}: GetAppsPaginator) {
  // Ensure limit is at least 5 (API requirement)
  const validLimit = Math.max(limit, 5);

  return http.get(
    `/apps?limit=${validLimit}&offset=${offset}&order=${order}&orderBy=${orderBy}`
  );
}

export function httpGetApp(id: string) {
  return http.get(`/apps/${id}`);
}

export function httpUpdateApp(appId: string, options: any) {
  return http.put(`/apps/${appId}`, {
    ...options,
  });
}

export function deleteApp(appId: string) {
  return http.delete(`/apps/${appId}`);
}

// ============ FILE UPLOAD ENDPOINTS ============

export function httpPostFile(file: File) {
  const fd = new FormData();
  fd.append("files", file);
  return http.post("/files", fd);
}

// ============ SOURCES/SITE CRAWL ENDPOINTS ============

export function setSourcesSiteCrawl(
  appId: string,
  url: string,
  followLink: boolean
) {
  return http.post(`/sources/site-crawl/${appId}`, {
    url,
    followLink,
  });
}

export function setSourcesSiteCrawlReindex(appId: string, urlId: string) {
  return http.post(`/sources/site-crawl-reindex/${appId}`, {
    urlId,
  });
}

export function deleteSourcesSiteCrawlV2(appId: string, urls: string[]) {
  return http.delete(`/sources/site-crawl-v2/url/${appId}`, {
    data: {
      urls,
    },
  });
}

export function setSourcesSiteFiles(appId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  return http.post(`/sources/docs/${appId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function setSourcesSiteFilesDelete(appId: string, fileId: string) {  
  return http.delete(`/sources/docs/${appId}/${fileId}`, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// ============ DOCUMENTS ENDPOINTS ============

export function getDocuments(walletAddress: string) {
  return http.get(`/docs/${walletAddress}`);
}

export async function postDocument(documentName: string, file: File) {
  const filePostResult = await httpPostFile(file);
  const fileLocation = filePostResult.data.results[0].location;
  return http.post("/docs", { documentName, files: [fileLocation] });
}

export function deleteDocuments(id: string) {
  return http.delete(`/docs/${id}`);
}

// ============ CHAT ENDPOINTS ============

export function createAppChat(appId: string, title: string, pinned: boolean) {
  return http.post(`/apps/create-app-chat/${appId}`, {
    title,
    pinned,
  });
}

export function getDefaultRooms(appId: string) {
  return http.get(`/apps/get-default-rooms/app-id/${appId}`);
}

// ============ USER MANAGEMENT ENDPOINTS ============

export function httpGetUsers(
  appId: string,
  limit: number = 10,
  offset: number = 0,
  orderBy:
    | "createdAt"
    | "displayName"
    | "totalRegistered"
    | "totalSessions"
    | "totalApiCalls"
    | "totalFiles"
    | "totalTransactions"
    | "lastName"
    | "email"
    | "firstName" = "lastName",
  order: "asc" | "desc" = "asc"
) {
  return http.get(
    `/users/${appId}?limit=${limit}&offset=${offset}&orderBy=${orderBy}&order=${order}`
  );
}

export function httpCraeteUser(
  appId: string,
  {
    email,
    firstName,
    lastName,
  }: { email: string; firstName: string; lastName: string }
) {
  return http.post(`/users/create-with-app-id/${appId}`, {
    email,
    firstName,
    lastName,
  });
}

export function httpUpdateOneUser(appId: string, userId: string, options: any) {
  return http.put(`/users/${appId}/${userId}`, {
    ...options,
  });
}

export function httpDeleteManyUsers(appId: string, usersIdList: Array<string>) {
  return http.post(`/users/delete-many-with-app-id/${appId}`, { usersIdList });
}

export function httpResetPasswords(appId: string, usersIdList: Array<string>) {
  return http.post(`/users/reset-passwords-with-app-id/${appId}`, {
    usersIdList,
  });
}

// ============ USER STATS & RESTRICTIONS ENDPOINTS ============

/**
 * Get user statistics and usage metrics
 * Returns aggregated stats across all user's apps/agents
 */
export function httpGetUserStats() {
  return http.get("/users/me/stats");
}

/**
 * Get user restrictions and limits
 * Returns plan limits, quotas, and feature restrictions
 */
export function httpGetUserRestrictions() {
  return http.get("/users/me/restrictions");
}

// ============ ERROR HANDLING ============

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      error?: string;
      message?: string;
    }>;
    return {
      message:
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        axiosError.message,
      status: axiosError.response?.status,
      code: axiosError.code,
    };
  }
  return {
    message:
      error instanceof Error ? error.message : "An unknown error occurred",
  };
}
