import { request } from '../../utils/request';

type UserResponse = {
  nickname: string;
  level?: string;
  totalPoints: number;
  totalCarbonKg: number;
};

type PointAccountResponse = {
  balance: number;
};

type ProfileUserView = {
  nickname: string;
  level: string;
  points: number;
  carbonKg: number;
};

function getDefaultUser(): ProfileUserView {
  return {
    nickname: '校园用户',
    level: '先锋绿色公民',
    points: 0,
    carbonKg: 0
  };
}

Page({
  data: {
    loading: false,
    authLoading: false,
    user: getDefaultUser(),
    session: {
      loggedIn: false,
      modeText: '尚未登录',
      actionText: '重新登录'
    },
    preferences: [
      {
        key: 'anxietyShield',
        title: '减压目标模式',
        icon: '/assets/icons/happy.svg',
        checked: true
      },
      {
        key: 'anonymousRank',
        title: '匿名排行模式',
        icon: '/assets/icons/anonymous.svg',
        checked: false
      }
    ],
    accountItems: [
      {
        title: '我的兑换',
        desc: '查看商城兑换订单与积分记录',
        icon: '/assets/icons/bag.svg',
        path: '/pages/redemptions/index'
      },
      {
        title: '接口环境',
        desc: '切换本地开发或自定义 API 地址',
        icon: '/assets/icons/grid.svg',
        path: '/pages/settings/index'
      }
    ],
    supportItems: [
      {
        title: '隐私政策',
        icon: '/assets/icons/gavel.svg',
        path: '/pages/privacy/index'
      },
      {
        title: '用户协议',
        icon: '/assets/icons/help.svg',
        path: '/pages/agreement/index'
      }
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

  onShow() {
    this.syncAuthState();
    this.loadProfileData();
  },

  syncAuthState() {
    const app = getApp<IAppOption>();
    const currentUser = app.getCurrentUser ? app.getCurrentUser() : null;
    const authMode = (app.globalData && app.globalData.authMode) || 'guest';

    this.setData({
      session: {
        loggedIn: Boolean(currentUser),
        modeText: currentUser ? (authMode === 'wechat' ? '当前为微信登录' : '当前为开发登录') : '尚未登录',
        actionText: currentUser ? '退出登录' : '重新登录'
      }
    });
  },

  async loadProfileData() {
    const app = getApp<IAppOption>();
    const currentUser = app.getCurrentUser ? app.getCurrentUser() : null;

    if (!currentUser) {
      this.setData({
        user: getDefaultUser(),
        loading: false
      });
      this.syncAuthState();
      return;
    }

    this.setData({ loading: true });

    try {
      const [user, pointAccount] = await Promise.all([
        request<UserResponse>({ url: '/users/me' }),
        request<PointAccountResponse>({ url: '/users/me/points' })
      ]);

      this.setData({
        user: {
          nickname: user?.nickname || '校园用户',
          level: user?.level || '先锋绿色公民',
          points: pointAccount?.balance || user?.totalPoints || 0,
          carbonKg: user?.totalCarbonKg || 0
        }
      });
    } catch (error) {
      if (String((error as Error)?.message || '').includes('请先登录')) {
        this.setData({ user: getDefaultUser() });
      } else {
        wx.showToast({
          title: '我的页面数据加载失败',
          icon: 'none'
        });
      }
      console.error(error);
    } finally {
      this.setData({ loading: false });
      this.syncAuthState();
    }
  },

  async handleSessionAction() {
    const app = getApp<IAppOption>();
    this.setData({ authLoading: true });

    try {
      if (this.data.session.loggedIn) {
        await app.logout();
        this.setData({ user: getDefaultUser() });
        wx.showToast({
          title: '已退出登录',
          icon: 'success'
        });
      } else {
        await app.refreshSession();
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
        await this.loadProfileData();
      }
    } catch (error) {
      wx.showToast({
        title: '登录状态更新失败',
        icon: 'none'
      });
      console.error(error);
    } finally {
      this.setData({ authLoading: false });
      this.syncAuthState();
    }
  },

  onPullDownRefresh() {
    this.loadProfileData().finally(() => wx.stopPullDownRefresh());
  },

  goToPage(event: WechatMiniprogram.BaseEvent) {
    const { path } = event.currentTarget.dataset as { path: string };
    if (!path) return;
    if (path === '/pages/home/index' || path === '/pages/profile/index') {
      wx.reLaunch({ url: path });
      return;
    }
    wx.navigateTo({ url: path });
  },

  togglePreference(event: WechatMiniprogram.BaseEvent) {
    const { key } = event.currentTarget.dataset as { key: string };
    const preferences = this.data.preferences.map((item: any) => {
      if (item.key !== key) return item;
      return { ...item, checked: !item.checked };
    });
    this.setData({ preferences });
  },

  openEntry(event: WechatMiniprogram.BaseEvent) {
    const { path } = event.currentTarget.dataset as { path: string };
    if (!path) return;
    wx.navigateTo({ url: path });
  }
});
