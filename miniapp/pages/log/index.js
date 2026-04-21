const { request } = require('../../utils/request');

Page({
  data: {
    submitting: false,
    rewardToast: {
      visible: false,
      title: '',
      points: 0,
      carbonText: ''
    },
    behaviorTypes: [
      { code: 'green_transit', icon: '/assets/icons/grid.svg', name: '绿色出行', carbon: '+120g', desc: '乘坐班车或骑行通学' },
      { code: 'bring_cup', icon: '/assets/icons/profile.svg', name: '自带水杯', carbon: '+40g', desc: '减少一次性塑料使用' },
      { code: 'bring_cutlery', icon: '/assets/icons/bag.svg', name: '自带餐具', carbon: '+80g', desc: '食堂打包也不拿一次性餐具' },
      { code: 'stairs_walk', icon: '/assets/icons/report.svg', name: '步行上楼', carbon: '+30g', desc: '少坐电梯多一点运动' },
      { code: 'clean_plate', icon: '/assets/icons/leaf.svg', name: '光盘行动', carbon: '+150g', desc: '杜绝校园餐食浪费' },
      { code: 'paperless_note', icon: '/assets/icons/note.svg', name: '无纸笔记', carbon: '+200g', desc: '电子学习减少纸张消耗' }
    ],
    tabs: [
      { key: 'home', label: '首页', icon: '/assets/icons/home.svg', path: '/pages/home/index' },
      { key: 'log', label: '日志', icon: '/assets/icons/note.svg', path: '/pages/log/index' },
      { key: 'plaza', label: '广场', icon: '/assets/icons/grid.svg', path: '/pages/plaza/index' },
      { key: 'mall', label: '商城', icon: '/assets/icons/bag.svg', path: '/pages/mall/index' },
      { key: 'report', label: '报告', icon: '/assets/icons/report.svg', path: '/pages/report/index' },
      { key: 'profile', label: '我的', icon: '/assets/icons/profile.svg', path: '/pages/profile/index' }
    ]
  },

  onLoad() {
    this.loadBehaviorCatalog();
  },

  onUnload() {
    this.clearRewardToastTimer();
  },

  clearRewardToastTimer() {
    if (this.rewardToastTimer) {
      clearTimeout(this.rewardToastTimer);
      this.rewardToastTimer = null;
    }
  },

  async loadBehaviorCatalog() {
    try {
      const catalog = await request({ url: '/behaviors/catalog' });
      const mapped = this.data.behaviorTypes.map((item) => {
        const remote = catalog.find((catalogItem) => catalogItem.code === item.code);
        if (!remote) return item;
        return {
          ...item,
          name: remote.name,
          carbon: `+${Math.round(remote.carbonKg * 1000)}g`
        };
      });
      this.setData({ behaviorTypes: mapped });
    } catch (error) {
      console.error(error);
    }
  },

  goToPage(event) {
    const path = event.currentTarget.dataset.path;
    if (!path) return;
    if (path === '/pages/home/index' || path === '/pages/log/index') {
      wx.reLaunch({ url: path });
      return;
    }
    wx.navigateTo({ url: path });
  },

  openVoiceRecord() {
    wx.showToast({
      title: '语音记录能力下一步接入',
      icon: 'none'
    });
  },

  openTextQa() {
    wx.navigateTo({ url: '/pages/agent/index' });
  },

  showRewardToast(payload) {
    this.clearRewardToastTimer();

    this.setData({
      rewardToast: {
        visible: true,
        title: '记录成功',
        points: payload.pointsAwarded,
        carbonText: `+${Math.round(payload.carbonKg * 1000)}g`
      }
    });

    this.rewardToastTimer = setTimeout(() => {
      this.hideRewardToast();
    }, 2400);
  },

  hideRewardToast() {
    this.clearRewardToastTimer();
    this.setData({
      rewardToast: {
        ...this.data.rewardToast,
        visible: false
      }
    });
  },

  async selectBehavior(event) {
    if (this.data.submitting) return;

    const { name, code } = event.currentTarget.dataset;
    this.setData({ submitting: true });

    try {
      const result = await request({
        url: '/behaviors',
        method: 'POST',
        data: {
          behaviorCode: code,
          behaviorName: name
        }
      });

      this.showRewardToast({
        behaviorName: name,
        pointsAwarded: result.record.pointsAwarded,
        carbonKg: result.record.carbonKg
      });
    } catch (error) {
      wx.showToast({
        title: '提交失败，请稍后再试',
        icon: 'none'
      });
      console.error(error);
    } finally {
      this.setData({ submitting: false });
    }
  }
});
