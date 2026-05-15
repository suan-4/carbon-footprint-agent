const { request } = require('../../utils/request');

Page({
  data: {
    submitting: false,
    activeTab: 'behavior',
    showCarbonEntry: false,
    entryForm: {
      dataType: 'travel',
      category: 'car',
      value: '',
      recordDate: ''
    },
    carbonFactors: {
      travel: [
        { code: 'car', name: '驾车', unit: 'km', factor: 0.21 },
        { code: 'taxi', name: '打车', unit: 'km', factor: 0.18 },
        { code: 'bus', name: '公交', unit: 'km', factor: 0.08 },
        { code: 'subway', name: '地铁', unit: 'km', factor: 0.04 },
        { code: 'bicycle', name: '骑行', unit: 'km', factor: 0 },
        { code: 'walk', name: '步行', unit: 'km', factor: 0 },
        { code: 'electric_scooter', name: '电动自行车', unit: 'km', factor: 0.02 }
      ],
      electricity: [
        { code: 'residential', name: '居民用电', unit: 'kWh', factor: 0.58 },
        { code: 'commercial', name: '商业用电', unit: 'kWh', factor: 0.72 }
      ]
    },
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
  },

  switchTab(event) {
    const tab = event.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  openCarbonEntry() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    this.setData({
      showCarbonEntry: true,
      entryForm: {
        dataType: 'travel',
        category: 'car',
        value: '',
        recordDate: dateStr
      }
    });
  },

  closeCarbonEntry() {
    this.setData({ showCarbonEntry: false });
  },

  onDataTypeChange(event) {
    const dataType = event.currentTarget.dataset.type;
    const defaultCategory = dataType === 'travel' ? 'car' : 'residential';
    this.setData({
      'entryForm.dataType': dataType,
      'entryForm.category': defaultCategory
    });
  },

  onCategoryChange(event) {
    const category = event.detail.value;
    this.setData({
      'entryForm.category': category
    });
  },

  onValueInput(event) {
    this.setData({
      'entryForm.value': event.detail.value
    });
  },

  onDateChange(event) {
    this.setData({
      'entryForm.recordDate': event.detail.value
    });
  },

  calculateCarbon() {
    const { dataType, category, value } = this.data.entryForm;
    if (!value || isNaN(value) || value <= 0) return 0;
    
    const typeFactors = this.data.carbonFactors[dataType];
    if (!typeFactors) return 0;
    
    const selectedCategory = typeFactors.find(c => c.code === category);
    if (!selectedCategory) return 0;
    
    return (value * selectedCategory.factor).toFixed(2);
  },

  async submitCarbonData() {
    const { dataType, category, value, recordDate } = this.data.entryForm;
    
    if (!value || isNaN(value) || value <= 0) {
      wx.showToast({
        title: '请输入有效的数值',
        icon: 'none'
      });
      return;
    }

    if (!recordDate) {
      wx.showToast({
        title: '请选择日期',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    try {
      await request({
        url: '/carbon-data',
        method: 'POST',
        data: {
          dataType,
          category,
          value: parseFloat(value),
          recordDate
        }
      });

      const carbonKg = this.calculateCarbon();
      wx.showToast({
        title: '录入成功',
        icon: 'success'
      });

      this.setData({ showCarbonEntry: false });
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
