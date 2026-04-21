type ApiEnvironmentOption = {
  key: 'local' | 'custom';
  label: string;
  baseUrl: string;
};

Page({
  data: {
    currentEnvironment: 'local' as 'local' | 'custom',
    currentLabel: '本地开发',
    currentBaseUrl: 'http://localhost:3000/api',
    baseUrlInput: '',
    envOptions: [] as ApiEnvironmentOption[],
    saving: false
  },

  onShow() {
    this.syncSettings();
  },

  syncSettings() {
    const app = getApp<IAppOption>();
    const settings = app.getApiSettings();

    this.setData({
      currentEnvironment: settings.environment,
      currentLabel: settings.label,
      currentBaseUrl: settings.baseUrl,
      baseUrlInput: settings.environment === 'custom' ? settings.baseUrl : '',
      envOptions: settings.options
    });
  },

  selectEnvironment(event: WechatMiniprogram.BaseEvent) {
    const { key } = event.currentTarget.dataset as { key: 'local' | 'custom' };
    if (!key) return;

    this.setData({
      currentEnvironment: key,
      baseUrlInput: key === 'custom' ? this.data.currentBaseUrl : ''
    });
  },

  handleBaseUrlInput(event: WechatMiniprogram.Input) {
    this.setData({
      baseUrlInput: String(event.detail.value || '').trim()
    });
  },

  async saveSettings() {
    const app = getApp<IAppOption>();
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
    const app = getApp<IAppOption>();
    app.resetApiBaseUrl();
    this.syncSettings();
    wx.showToast({
      title: '已恢复本地环境',
      icon: 'success'
    });
  }
});
