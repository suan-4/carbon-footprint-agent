const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';
const DEFAULT_API_ENVIRONMENT = 'local';
const API_BASE_URL_STORAGE_KEY = 'carbon_api_base_url';
const API_ENVIRONMENT_STORAGE_KEY = 'carbon_api_environment';
const AUTH_TOKEN_STORAGE_KEY = 'carbon_auth_token';
const DEVICE_ID_STORAGE_KEY = 'carbon_device_id';
const AUTO_LOGIN_DISABLED_STORAGE_KEY = 'carbon_auto_login_disabled';

const API_ENVIRONMENT_OPTIONS = [
  { key: 'local' as const, label: '本地开发', baseUrl: DEFAULT_API_BASE_URL },
  { key: 'custom' as const, label: '自定义地址', baseUrl: '' }
];

type ApiEnvelope<T> = {
  code?: number;
  message?: string;
  data?: T;
};

type LoginPayload = {
  token: string;
  mode: string;
  user: AuthUser;
};

type SessionPayload = {
  loggedIn: boolean;
  user: AuthUser | null;
};

function safeGetStorage(key: string) {
  try {
    return wx.getStorageSync(key);
  } catch (error) {
    return '';
  }
}

function safeSetStorage(key: string, value: string) {
  try {
    wx.setStorageSync(key, value);
  } catch (error) {
    console.warn(`set storage failed: ${key}`, error);
  }
}

function safeRemoveStorage(key: string) {
  try {
    wx.removeStorageSync(key);
  } catch (error) {
    console.warn(`remove storage failed: ${key}`, error);
  }
}

function normalizeApiBaseUrl(value: string) {
  const text = String(value || '').trim();
  if (!text) return DEFAULT_API_BASE_URL;
  return text.replace(/\/+$/, '');
}

function resolveApiBaseUrl() {
  return normalizeApiBaseUrl(String(safeGetStorage(API_BASE_URL_STORAGE_KEY) || DEFAULT_API_BASE_URL));
}

function resolveApiEnvironment() {
  const currentValue = String(safeGetStorage(API_ENVIRONMENT_STORAGE_KEY) || DEFAULT_API_ENVIRONMENT).trim();
  return currentValue === 'custom' ? 'custom' : 'local';
}

function resolveStoredToken() {
  return String(safeGetStorage(AUTH_TOKEN_STORAGE_KEY) || '').trim();
}

function resolveAutoLoginEnabled() {
  return String(safeGetStorage(AUTO_LOGIN_DISABLED_STORAGE_KEY) || '') !== '1';
}

function createDeviceId() {
  return `device-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function resolveDeviceId() {
  const storedValue = String(safeGetStorage(DEVICE_ID_STORAGE_KEY) || '').trim();

  if (storedValue) {
    return storedValue;
  }

  const nextValue = createDeviceId();
  safeSetStorage(DEVICE_ID_STORAGE_KEY, nextValue);
  return nextValue;
}

function requestLoginCode(): Promise<string> {
  return new Promise((resolve) => {
    wx.login({
      success(result) {
        resolve(String(result.code || ''));
      },
      fail() {
        resolve('');
      }
    });
  });
}

function sendRequest<T>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: WechatMiniprogram.IAnyObject;
    header?: WechatMiniprogram.IAnyObject;
    timeout?: number;
  } = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      timeout: options.timeout || 10000,
      header: options.header || {},
      success(res) {
        const { statusCode, data } = res;
        const response = (data || {}) as ApiEnvelope<T>;

        if (statusCode >= 200 && statusCode < 300 && response.code === 0) {
          resolve(response.data as T);
          return;
        }

        reject(new Error(response.message || `Request failed: ${statusCode}`));
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

App<IAppOption>({
  loginPromise: null,

  globalData: {
    apiBaseUrl: resolveApiBaseUrl(),
    apiEnvironment: resolveApiEnvironment(),
    appName: '碳迹同行',
    themeColor: '#2ECC71',
    authToken: resolveStoredToken(),
    currentUser: null,
    authMode: 'guest',
    isLoggingIn: false,
    autoLoginEnabled: resolveAutoLoginEnabled()
  },

  onLaunch() {
    console.info(`碳迹同行小程序启动完成，当前接口地址：${this.globalData.apiBaseUrl}`);

    if (this.globalData.autoLoginEnabled) {
      this.ensureSession().catch((error) => {
        console.warn('silent login failed', error);
      });
    }
  },

  setApiBaseUrl(nextBaseUrl: string) {
    const apiBaseUrl = normalizeApiBaseUrl(nextBaseUrl);
    this.globalData.apiBaseUrl = apiBaseUrl;
    safeSetStorage(API_BASE_URL_STORAGE_KEY, apiBaseUrl);
  },

  resetApiBaseUrl() {
    this.globalData.apiBaseUrl = DEFAULT_API_BASE_URL;
    this.globalData.apiEnvironment = 'local';
    safeRemoveStorage(API_BASE_URL_STORAGE_KEY);
    safeRemoveStorage(API_ENVIRONMENT_STORAGE_KEY);
  },

  setApiEnvironment(nextEnvironment: 'local' | 'custom', nextBaseUrl = '') {
    const apiEnvironment = nextEnvironment === 'custom' ? 'custom' : 'local';
    this.globalData.apiEnvironment = apiEnvironment;
    safeSetStorage(API_ENVIRONMENT_STORAGE_KEY, apiEnvironment);

    if (apiEnvironment === 'local') {
      this.setApiBaseUrl(DEFAULT_API_BASE_URL);
      return;
    }

    this.setApiBaseUrl(nextBaseUrl || this.globalData.apiBaseUrl || DEFAULT_API_BASE_URL);
  },

  getApiSettings() {
    const environment = this.globalData.apiEnvironment || 'local';
    const matchedOption = API_ENVIRONMENT_OPTIONS.find((item) => item.key === environment) || API_ENVIRONMENT_OPTIONS[0];

    return {
      environment,
      label: matchedOption.label,
      baseUrl: this.globalData.apiBaseUrl || DEFAULT_API_BASE_URL,
      options: API_ENVIRONMENT_OPTIONS.map((item) => ({
        key: item.key,
        label: item.label,
        baseUrl: item.baseUrl || (item.key === environment ? this.globalData.apiBaseUrl : '')
      }))
    };
  },

  getAuthToken() {
    return this.globalData.authToken || resolveStoredToken();
  },

  getCurrentUser() {
    return this.globalData.currentUser || null;
  },

  async ensureSession(force = false) {
    if (force) {
      this.globalData.autoLoginEnabled = true;
      safeRemoveStorage(AUTO_LOGIN_DISABLED_STORAGE_KEY);
    }

    if (!this.globalData.autoLoginEnabled) {
      return this.getCurrentUser();
    }

    if (this.loginPromise) {
      return this.loginPromise;
    }

    this.globalData.isLoggingIn = true;

    this.loginPromise = (async () => {
      const currentToken = !force ? this.getAuthToken() : '';

      if (currentToken) {
        try {
          const session = await this.getSessionByToken(currentToken);
          if (session.loggedIn && session.user) {
            this.applySession(currentToken, session.user, session.user.loginMode || 'session');
            return session.user;
          }
        } catch (error) {
          console.warn('restore session failed', error);
        }

        this.clearSession();
      }

      const code = await requestLoginCode();
      const loginResult = await this.callApi<LoginPayload>('/auth/login', {
        method: 'POST',
        data: {
          code,
          deviceId: resolveDeviceId(),
          profile: {
            nickname: '校园用户'
          }
        },
        skipAuth: true
      });

      this.applySession(loginResult.token, loginResult.user, loginResult.mode);
      return loginResult.user;
    })()
      .catch((error) => {
        console.error('ensure session failed', error);
        this.clearSession();
        return null;
      })
      .finally(() => {
        this.loginPromise = null;
        this.globalData.isLoggingIn = false;
      });

    return this.loginPromise;
  },

  async refreshSession() {
    return this.ensureSession(true);
  },

  async logout() {
    const token = this.getAuthToken();

    if (token) {
      try {
        await this.callApi<boolean>('/auth/logout', {
          method: 'POST',
          token,
          skipAuth: true
        });
      } catch (error) {
        console.warn('logout request failed', error);
      }
    }

    this.clearSession(true);
  },

  applySession(token: string, user: AuthUser, mode: string) {
    this.globalData.authToken = String(token || '').trim();
    this.globalData.currentUser = user || null;
    this.globalData.authMode = mode || 'dev';
    this.globalData.autoLoginEnabled = true;

    if (this.globalData.authToken) {
      safeSetStorage(AUTH_TOKEN_STORAGE_KEY, this.globalData.authToken);
    }
    safeRemoveStorage(AUTO_LOGIN_DISABLED_STORAGE_KEY);
  },

  clearSession(disableAutoLogin = false) {
    this.globalData.authToken = '';
    this.globalData.currentUser = null;
    this.globalData.authMode = 'guest';

    safeRemoveStorage(AUTH_TOKEN_STORAGE_KEY);

    if (disableAutoLogin) {
      this.globalData.autoLoginEnabled = false;
      safeSetStorage(AUTO_LOGIN_DISABLED_STORAGE_KEY, '1');
      return;
    }

    this.globalData.autoLoginEnabled = true;
    safeRemoveStorage(AUTO_LOGIN_DISABLED_STORAGE_KEY);
  },

  async getSessionByToken(token: string) {
    return this.callApi<SessionPayload>('/auth/session', {
      method: 'GET',
      token,
      skipAuth: true
    });
  },

  async callApi<T = any>(path: string, options: AppRequestOptions = {}) {
    const requestToken = options.skipAuth
      ? String(options.token || '').trim()
      : String(options.token || this.getAuthToken()).trim();

    const header: WechatMiniprogram.IAnyObject = {
      'Content-Type': 'application/json',
      ...(options.header || {})
    };

    if (requestToken) {
      header.Authorization = `Bearer ${requestToken}`;
    }

    return sendRequest<T>(`${this.globalData.apiBaseUrl}${path}`, {
      method: options.method || 'GET',
      data: options.data,
      timeout: options.timeout || 10000,
      header
    });
  }
});
