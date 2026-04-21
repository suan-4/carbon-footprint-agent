Page({
  data: {
    currentEnvironment: 'local',
    currentLabel: '本地开发',
    currentBaseUrl: 'http://localhost:3000/api',
    baseUrlInput: '',
    envOptions: [],
    saving: false
  },

  onShow() {
    this.syncSettings();
  },

  syncSettings() {
    const app = getApp();
    const settings = app.getApiSettings();

    this.setData({
      currentEnvironment: settings.environment,
      currentLabel: settings.label,
      currentBaseUrl: settings.baseUrl,
      baseUrlInput: settings.environment === 'custom' ? settings.baseUrl : '',
      envOptions: settings.options
    });
  },

  selectEnvironment(event) {
    const { key } = event.currentTarget.dataset;
    if (!key) return;

    this.setData({
      currentEnvironment: key,
      baseUrlInput: key === 'custom' ? this.data.currentBaseUrl : ''
    });
  },

  handleBaseUrlInput(event) {
    this.setData({
      baseUrlInput: String(event.detail.value || '').trim()
    });
  },

  async saveSettings() {
    const app = getApp();
    const isCustom = this.data.currentEnvironment === 'custom';
    const nextBaseUrl = isCustom ? this.data.baseUrlInput : 'http://localhost:3000/api';

    if (isCustom && !/^https?:\/\//.test(nextBaseUrl)) {
      wx.showToast({
        title: '请输入完整 http 或 https 地址',
        icon: 'none'
      });
      return;
    }

    this.setData({ saving: true });

    try {
      app.setApiEnvironment(this.data.currentEnvironment, nextBaseUrl);
      this.syncSettings();
      wx.showToast({
        title: '环境已更新',
        icon: 'success'
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  resetToLocal() {
    const app = getApp();
    app.resetApiBaseUrl();
    this.syncSettings();
    wx.showToast({
      title: '已恢复本地环境',
      icon: 'success'
    });
  }
});
