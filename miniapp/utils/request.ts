export function request<T = any>(options: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: WechatMiniprogram.IAnyObject;
  header?: WechatMiniprogram.IAnyObject;
  timeout?: number;
  skipAuth?: boolean;
}): Promise<T> {
  const app = getApp<IAppOption>();
  const shouldAttachAuth = !options.skipAuth;

  return (async () => {
    if (shouldAttachAuth && app.ensureSession) {
      try {
        await app.ensureSession();
      } catch (error) {
        console.warn('ensure session before request failed', error);
      }
    }

    const baseUrl = app.globalData.apiBaseUrl || '';
    const authToken = shouldAttachAuth && app.getAuthToken ? app.getAuthToken() : '';
    const url = `${baseUrl}${options.url}`;

    return new Promise<T>((resolve, reject) => {
      const header: WechatMiniprogram.IAnyObject = {
        'Content-Type': 'application/json',
        ...(options.header || {})
      };

      if (authToken) {
        header.Authorization = `Bearer ${authToken}`;
      }

      wx.request({
        url,
        method: options.method || 'GET',
        data: options.data,
        timeout: options.timeout || 10000,
        header,
        success(res) {
          const { statusCode, data } = res;
          const response = data as { code?: number; message?: string; data?: T };

          if (statusCode >= 200 && statusCode < 300 && response && response.code === 0) {
            resolve(response.data as T);
            return;
          }

          reject(new Error((response && response.message) || `Request failed: ${statusCode}`));
        },
        fail(error) {
          reject(error);
        }
      });
    });
  })();
}
