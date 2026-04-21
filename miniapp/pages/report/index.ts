import { request } from '../../utils/request';

type WeeklyTrendItem = {
  day: string;
  carbonKg: number;
};

type WeeklyReportResponse = {
  weekLabel: string;
  carbonKg: number;
  pointsEarned: number;
  behaviorCount: number;
  trend: WeeklyTrendItem[];
};

Page({
  data: {
    loading: false,
    overview: {
      weekLabel: '2026-W13',
      carbonKg: 24.8,
      pointsEarned: 126,
      behaviorCount: 18,
      trendPercent: 12
    },
    metrics: [
      { key: 'carbon', label: '本周减碳', value: '24.8 kg', icon: '/assets/icons/leaf.svg' },
      { key: 'points', label: '本周积分', value: '126 分', icon: '/assets/icons/recycle.svg' },
      { key: 'count', label: '行为次数', value: '18 次', icon: '/assets/icons/note.svg' }
    ],
    trendBars: [] as Array<WeeklyTrendItem & { height: number; active: boolean }>,
    highlight: {
      title: '本周最佳减碳日',
      value: '周五 · 5.4kg',
      desc: '这是你本周减碳表现最亮眼的一天，继续保持这个节奏。'
    },
    tabs: [
      { key: 'home', label: '首页', icon: '/assets/icons/home.svg', path: '/pages/home/index' },
      { key: 'log', label: '日志', icon: '/assets/icons/note.svg', path: '/pages/log/index' },
      { key: 'plaza', label: '广场', icon: '/assets/icons/grid.svg', path: '/pages/plaza/index' },
      { key: 'mall', label: '商城', icon: '/assets/icons/bag.svg', path: '/pages/mall/index' },
      { key: 'report', label: '报告', icon: '/assets/icons/report.svg', path: '/pages/report/index' },
      { key: 'profile', label: '我的', icon: '/assets/icons/profile.svg', path: '/pages/profile/index' }
    ]
  },

  onShow() {
    this.loadReportData();
  },

  buildTrendBars(trend: WeeklyTrendItem[]) {
    const maxValue = trend.reduce((max, item) => Math.max(max, item.carbonKg || 0), 0) || 1;
    return trend.map((item, index) => ({
      ...item,
      height: Math.max(36, Math.round(((item.carbonKg || 0) / maxValue) * 160)),
      active: index === trend.length - 1
    }));
  },

  buildHighlight(trend: WeeklyTrendItem[]) {
    if (!trend.length) {
      return {
        title: '本周最佳减碳日',
        value: '暂无数据',
        desc: '完成日志记录后，这里会自动生成你的周报亮点。'
      };
    }

    const bestDay = trend.reduce((best, item) => {
      return (item.carbonKg || 0) > (best.carbonKg || 0) ? item : best;
    }, trend[0]);

    return {
      title: '本周最佳减碳日',
      value: `${bestDay.day} · ${bestDay.carbonKg}kg`,
      desc: '这是你本周减碳表现最亮眼的一天，继续保持这个节奏。'
    };
  },

  async loadReportData() {
    this.setData({ loading: true });
    try {
      const weeklyReport = await request<WeeklyReportResponse>({ url: '/reports/weekly-overview' });
      const trend = weeklyReport?.trend || [];
      const latest = trend.length ? trend[trend.length - 1].carbonKg : 0;
      const previous = trend.length > 1 ? trend[trend.length - 2].carbonKg : latest || 1;
      const trendPercent = previous ? Math.round(((latest - previous) / previous) * 100) : 0;

      this.setData({
        overview: {
          weekLabel: weeklyReport?.weekLabel || '本周',
          carbonKg: weeklyReport?.carbonKg || 0,
          pointsEarned: weeklyReport?.pointsEarned || 0,
          behaviorCount: weeklyReport?.behaviorCount || 0,
          trendPercent
        },
        metrics: [
          { key: 'carbon', label: '本周减碳', value: `${weeklyReport?.carbonKg || 0} kg`, icon: '/assets/icons/leaf.svg' },
          { key: 'points', label: '本周积分', value: `${weeklyReport?.pointsEarned || 0} 分`, icon: '/assets/icons/recycle.svg' },
          { key: 'count', label: '行为次数', value: `${weeklyReport?.behaviorCount || 0} 次`, icon: '/assets/icons/note.svg' }
        ],
        trendBars: this.buildTrendBars(trend),
        highlight: this.buildHighlight(trend)
      });
    } catch (error) {
      wx.showToast({
        title: '报告数据加载失败',
        icon: 'none'
      });
      console.error(error);
    } finally {
      this.setData({ loading: false });
    }
  },

  onPullDownRefresh() {
    this.loadReportData().finally(() => wx.stopPullDownRefresh());
  },

  goToPage(event: WechatMiniprogram.BaseEvent) {
    const { path } = event.currentTarget.dataset as { path: string };
    if (!path) return;
    if (path === '/pages/home/index' || path === '/pages/report/index') {
      wx.reLaunch({ url: path });
      return;
    }
    wx.navigateTo({ url: path });
  },

  generatePoster() {
    wx.showToast({
      title: '海报生成功能下一步接入',
      icon: 'none'
    });
  },

  openAgent() {
    wx.navigateTo({ url: '/pages/agent/index' });
  }
});
