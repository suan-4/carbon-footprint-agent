/// <reference types="miniprogram-api-typings" />

interface AuthUser {
  id: number;
  nickname: string;
  avatarUrl: string;
  level: string;
  totalPoints: number;
  totalCarbonKg: number;
  openId?: string;
  loginMode?: string;
}

interface AppRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: WechatMiniprogram.IAnyObject;
  header?: WechatMiniprogram.IAnyObject;
  timeout?: number;
  token?: string;
  skipAuth?: boolean;
}

interface IAppOption {
  globalData: {
    apiBaseUrl: string;
    apiEnvironment: 'local' | 'custom';
    appName: string;
    themeColor: string;
    authToken: string;
    currentUser: AuthUser | null;
    authMode: string;
    isLoggingIn: boolean;
    autoLoginEnabled: boolean;
  };
  loginPromise?: Promise<AuthUser | null> | null;
  setApiBaseUrl: (nextBaseUrl: string) => void;
  resetApiBaseUrl: () => void;
  setApiEnvironment: (nextEnvironment: 'local' | 'custom', nextBaseUrl?: string) => void;
  getApiSettings: () => {
    environment: 'local' | 'custom';
    label: string;
    baseUrl: string;
    options: Array<{ key: 'local' | 'custom'; label: string; baseUrl: string }>;
  };
  getAuthToken: () => string;
  getCurrentUser: () => AuthUser | null;
  ensureSession: (force?: boolean) => Promise<AuthUser | null>;
  refreshSession: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  applySession: (token: string, user: AuthUser, mode: string) => void;
  clearSession: (disableAutoLogin?: boolean) => void;
  getSessionByToken: (token: string) => Promise<{ loggedIn: boolean; user: AuthUser | null }>;
  callApi: <T = any>(path: string, options?: AppRequestOptions) => Promise<T>;
}
