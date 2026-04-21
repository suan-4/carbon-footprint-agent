function request(options) {
  const app = getApp();
  const shouldAttachAuth = !options.skipAuth;

  const doRequest = () => {
    const baseUrl = app.globalData.apiBaseUrl || '';
    const authToken = shouldAttachAuth && app.getAuthToken ? app.getAuthToken() : '';
    const url = `${baseUrl}${options.url}`;
    const header = {
      'Content-Type': 'application/json',
      ...(options.header || {})
    };

    if (authToken) {
      header.Authorization = `Bearer ${authToken}`;
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method: options.method || 'GET',
        data: options.data,
        timeout: options.timeout || 10000,
        header,
        success(res) {
          const { statusCode, data } = res;
          if (statusCode >= 200 && statusCode < 300 && data && data.code === 0) {
            resolve(data.data);
            return;
          }

          reject(new Error((data && data.message) || `Request failed: ${statusCode}`));
        },
        fail(error) {
          reject(error);
        }
      });
    });
  };

  if (shouldAttachAuth && app.ensureSession) {
    return app
      .ensureSession()
      .catch((error) => {
        console.warn('ensure session before request failed', error);
      })
      .then(doRequest);
  }

  return doRequest();
}

module.exports = {
  request
};
