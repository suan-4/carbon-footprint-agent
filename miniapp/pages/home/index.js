const { request } = require('../../utils/request');

Page({
  data: {
    loading: false,
    overview: {
      points: 1284,
      carbonKg: 24.8,
      streak: 7,
      completion: 80,
      trend: 12
    },
    quickActions: [
      {
        icon: '/assets/icons/recycle.svg',
        title: '旧物回收',
        desc: '一键进入可回收物记录'
      },
      {
        icon: '/assets/icons/forest.svg',
        title: '校园森林',
        desc: '查看树木认养与绿色活动'
      }
    ],
    challenge: {
      badge: 'HOT CHALLENGE',
      title: '加入低碳挑战',
      desc: '和 2,400+ 位同学一起开启本周绿色行动。',
      buttonText: '立即参加'
    },
    achievements: [
      {
        title: '连续 7 天自带水杯',
        desc: '已达成“水资源守护者”阶段目标',
        carbon: '+150g',
        time: '2 小时前',
        cover: '/assets/icons/recycle.svg'
      },
      {
        title: '单车骑行 3.2km',
        desc: '减少了校园短途交通的碳排放',
        carbon: '+480g',
        time: '昨天',
        cover: '/assets/icons/forest.svg'
      }
    ],
    campusNews: {
      quote: '本月全校共节省纸张 1.2 吨，相当于种下了 20 棵树。',
      author: '校环境部',
      time: '30 分钟前发布'
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
    this.loadHomeData();
  },

  async loadHomeData() {
    this.setData({ loading: true });
    try {
      const [user, pointAccount, weeklyReport] = await Promise.all([
        request({ url: '/users/me' }),
        request({ url: '/users/me/points' }),
        request({ url: '/reports/weekly-overview' })
      ]);

      const trend = weeklyReport && weeklyReport.trend ? weeklyReport.trend : [];
      const latest = trend.length ? trend[trend.length - 1].carbonKg : 0;
      const previous = trend.length > 1 ? trend[trend.length - 2].carbonKg : latest || 1;
      const trendPercent = previous ? Math.round(((latest - previous) / previous) * 100) : 0;
      const completion = Math.min(100, Math.max(0, Math.round(((weeklyReport.pointsEarned || 0) / 160) * 100)));
      const weeklyCarbonKg = Number(weeklyReport.carbonKg || 0);

      this.setData({
        overview: {
          points: pointAccount.balance || user.totalPoints || 0,
          carbonKg: user.totalCarbonKg || 0,
          streak: 7,
          completion,
          trend: trendPercent
        },
        achievements: [
          {
            title: '本周减碳累计',
            desc: `本周共完成 ${weeklyReport.behaviorCount || 0} 次低碳记录`,
            carbon: `+${weeklyCarbonKg}kg`,
            time: weeklyReport.weekLabel || '本周',
            cover: '/assets/icons/recycle.svg'
          },
          {
            title: '积分账户余额',
            desc: '已同步到当前积分账户，可继续兑换权益',
            carbon: `${pointAccount.balance || 0}分`,
            time: pointAccount.updatedAt || '刚刚更新',
            cover: '/assets/icons/forest.svg'
          }
        ],
        campusNews: {
          quote: `${user.nickname} 本周已累计减碳 ${weeklyCarbonKg.toFixed(1)} kg，继续保持绿色节奏。`,
          author: '校园数据看板',
          time: weeklyReport.weekLabel || '本周统计'
        }
      });
    } catch (error) {
      wx.showToast({
        title: '首页数据加载失败',
        icon: 'none'
      });
      console.error(error);
    } finally {
      this.setData({ loading: false });
    }
  },

  onPullDownRefresh() {
    this.loadHomeData().finally(() => wx.stopPullDownRefresh());
  },

  goToPage(event) {
    const path = event.currentTarget.dataset.path;
    if (!path) return;
    if (path === '/pages/home/index') {
      wx.reLaunch({ url: path });
      return;
    }
    wx.navigateTo({ url: path });
  },

  recordNow() {
    wx.navigateTo({ url: '/pages/log/index' });
  },

  askLater() {
    wx.showToast({
      title: '稍后提醒已记录',
      icon: 'none'
    });
  },

  openVoiceAssistant() {
    wx.navigateTo({ url: '/pages/agent/index' });
  }
});
