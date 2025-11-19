/**
 * Type definitions mirroring the original app's models.ts
 * These types match the exact structure from the existing React app
 */

export interface ModelCurrentUser {
  _id: string;
  appId: string;
  firstName: string;
  lastName: string;
  homeScreen: string;
  isAgreeWithTerms: boolean;
  isAssetsOpen: boolean;
  isProfileOpen: boolean;
  token: string;
  refreshToken: string;
  wsToken: string;
  walletAddress: string;
  xmppPassword: string;
  xmppUsername: string;
  profileImage: string;
  description: string;
  defaultWallet: {
    walletAddress: string;
  };
  isSuperAdmin?: {
    read: boolean;
    write: boolean;
  };
  email?: string;
  orgId?: string;
  theme?: 'light' | 'dark' | 'system';
}

export interface SiteLinks {
  createdAt: string;
  updatedAt?: string;
  id: string;
  url: string;
  mdByteSize: number;
  md: string;
}

export interface Files {
  createdAt: string;
  id: string;
  md: string;
  mdByteSize: number;
  url: string;
  file?: File;
}

export interface ModelAIbot {
  userId: string;
  chatId: string;
  status: 'on' | 'off';
  greetingMessage: string;
  isRAG: boolean;
  trigger: string;
  prompt: string;
  siteLinks: Array<string>;
  siteUrlsV2: Array<SiteLinks>;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    isBot: boolean;
  };
  chat: {
    _id: string;
    name: string;
    title: string;
    description: string;
    type: string;
    picture: string;
  };
  files: Array<Files>;
}

export interface ModelAppDefaulRooom {
  jid: string;
  pinned: boolean;
  title: string;
  creator: string;
  chatId: string;
}

export interface ModelApp {
  appToken: string;
  bundleId: string;
  coinName: string;
  coinSymbol: string;
  createdAt: string;
  creatorId: string;
  defaultAccessAssetsOpen: boolean;
  defaultAccessProfileOpen: boolean;
  defaultRooms: Array<ModelAppDefaulRooom>;
  displayName: string;
  domainName: string;
  isAllowedNewAppCreate: boolean;
  isBaseApp: boolean;
  parentAppId: string;
  primaryColor: string;
  signonOptions: Array<string>;
  logoImage: string;
  sublogoImage: string;
  appTagline: string;
  firebaseWebConfigString?: string;
  firebaseConfigParsed?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  stats: {
    recentlyApiCalls: number;
    recentlyFiles: number;
    recentlyIssuance: number;
    recentlyRegistered: number;
    recentlySessions: number;
    recentlyTokens: number;
    recentlyTransactions: number;
    totalApiCalls: number;
    totalFiles: number;
    totalIssuance: number;
    totalRegistered: number;
    totalSessions: number;
    totalTransactions: number;
    totalChats: number;
    totalTokens: number;
    recentlyChats: number;
  };
  systemChatAccount: {
    jid: string;
  };
  updatedAt: string;
  usersCanFree: boolean;
  _id: string;
  afterLoginPage: string;
  availableMenuItems: {
    chats: boolean;
    profile: boolean;
    settings: boolean;
  };
  googleServicesJson: string;
  googleServiceInfoPlist: string;
  appSecret: string;
  allowUsersToCreateRooms: boolean;
  aiBot: ModelAIbot;

  botStatus?: 'on' | 'off';
}

export interface ModelAiWidgetValues {
  displayName: string;
  avatar: string;
}

export interface ModelState {
  inited: boolean;
  currentUser: ModelCurrentUser | null;
  currentApp: ModelApp | null;
  apps: Array<ModelApp>;
  aiWidgetValues: ModelAiWidgetValues;
}

// Agent creation payload (maps to app creation)
export interface CreateAgentPayload {
  displayName: string;
  // Additional fields for agent-specific settings
  prompt?: string;
  greetingMessage?: string;
  isRAG?: boolean;
  siteUrls?: string[];
  allowedDomains?: string[];
  isPublic?: boolean;
}

// Agent status
export type AgentStatus = 'indexing' | 'ready' | 'error' | 'pending';

export interface Agent {
  _id: string;
  displayName: string;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
  aiBot?: ModelAIbot;
  // Additional agent-specific fields
  sourceType?: 'website' | 'documents';
  documentsCount?: number;
  indexedPages?: number;
}

// User Statistics
export interface UserStats {
  totalApiCalls: number;
  totalFiles: number;
  totalChats: number;
  totalSessions: number;
  totalAgents: number;
  recentlyApiCalls: number;
  recentlyFiles: number;
  recentlyChats: number;
  recentlySessions: number;
  period: string; // e.g., '30d', '7d', '1d'
}

// User Restrictions and Limits
export interface UserRestrictions {
  plan: 'free' | 'pro' | 'enterprise' | string;
  limits: {
    maxAgents: number;
    maxApiCallsPerMonth: number;
    maxFilesPerAgent: number;
    maxChatsPerMonth: number;
    maxStorageGB: number;
    maxSessionsPerMonth: number;
  };
  features: {
    canCreateAgents: boolean;
    canUploadFiles: boolean;
    canUseRAG: boolean;
    canUseCustomDomains: boolean;
    canUseWebhooks: boolean;
    canExportData: boolean;
    canAccessAPI: boolean;
  };
  usage: {
    agentsUsed: number;
    apiCallsUsed: number;
    filesUsed: number;
    chatsUsed: number;
    sessionsUsed: number;
    storageUsedGB: number;
  };
}

