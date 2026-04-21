import { request } from '../../utils/request';

type PlazaPost = {
  id: number;
  type: 'help' | 'book';
  title: string;
  meta: string;
  desc: string;
  reward: string;
  tags: string[];
  icon: string;
  iconClass: string;
};

type PlazaFeedResponse = {
  anonymousMode: boolean;
  currentClaimPostId: number;
  highlight: {
    code: string;
    desc: string;
    status: string;
  };
  posts: PlazaPost[];
};

type PlazaClaimResponse = {
  postId: number;
  title: string;
  claimCode: string;
  highlight: {
    code: string;
    desc: string;
    status: string;
  };
};

type PlazaCompleteResponse = {
  postId: number;
  title: string;
  claimCode: string;
  pointsAwarded: number;
  pointAccount: {
    balance: number;
  };
  highlight: {
    code: string;
    desc: string;
    status: string;
  };
};

Page({
  data: {
    loading: false,
    completing: false,
    currentClaimPostId: 0,
    anonymousMode: true,
    claimToast: {
      visible: false,
      title: ''
    },
    activeFilter: 'all',
    filters: [
      { key: 'all', label: '全部' },
      { key: 'help', label: '互助需求' },
      { key: 'book', label: '教材流转' }
    ],
    highlight: {
      code: 'GH2025',
      desc: '你已成功认领一项顺路互助任务，请凭对接码在指定区域联系发布者。',
      status: '进行中'
    },
    posts: [] as PlazaPost[],
    visiblePosts: [] as PlazaPost[],
    rules: [
      {
        title: '默认匿名展示',
        desc: 'MVP 阶段先保护用户隐私，只展示任务内容、区域和匿名对接信息。'
      },
      {
        title: '先认领再联系',
        desc: '认领后才生成对接码，后端接入后会补齐状态流转和核销记录。'
      },
      {
        title: '优先低碳互助',
        desc: '广场优先支持顺路、共享、回收与教材流转等真正能减少浪费的场景。'
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
    this.loadPlazaFeed();
  },

  async loadPlazaFeed() {
    this.setData({ loading: true });

    try {
      const result = await request<PlazaFeedResponse>({
        url: '/plaza/feed'
      });

      const posts = result.posts || [];

      this.setData(
        {
          anonymousMode: Boolean(result.anonymousMode),
          currentClaimPostId: Number(result.currentClaimPostId || 0),
          highlight: result.highlight || this.data.highlight,
          posts
        },
        () => {
          this.syncVisiblePosts(this.data.activeFilter);
        }
      );
    } catch (error) {
      wx.showToast({
        title: '广场数据加载失败',
        icon: 'none'
      });
      console.error(error);
    } finally {
      this.setData({ loading: false });
    }
  },

  syncVisiblePosts(filterKey: string) {
    const visiblePosts = filterKey === 'all' ? this.data.posts : this.data.posts.filter((item) => item.type === filterKey);
    this.setData({ activeFilter: filterKey, visiblePosts });
  },

  switchFilter(event: WechatMiniprogram.BaseEvent) {
    const { key } = event.currentTarget.dataset as { key: string };
    this.syncVisiblePosts(key || 'all');
  },

  toggleAnonymousMode() {
    const nextValue = !this.data.anonymousMode;
    this.setData({ anonymousMode: nextValue });
  },

  hideClaimToast() {
    this.setData({
      claimToast: {
        visible: false,
        title: ''
      }
    });
  },

  async claimPost(event: WechatMiniprogram.BaseEvent) {
    const { id, title } = event.currentTarget.dataset as { id: number; title: string };

    if (!id) return;

    try {
      const result = await request<PlazaClaimResponse>({
        url: `/plaza/posts/${id}/claim`,
        method: 'POST'
      });

      this.setData({
        currentClaimPostId: result.postId,
        highlight: result.highlight || this.data.highlight,
        claimToast: {
          visible: true,
          title: title || ''
        }
      });

      await this.loadPlazaFeed();

      setTimeout(() => {
        if (this.data.claimToast.visible && this.data.claimToast.title === title) {
          this.hideClaimToast();
        }
      }, 1800);
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '认领失败',
        icon: 'none'
      });
      console.error(error);
    }
  },

  async completeClaim() {
    if (this.data.completing || !this.data.highlight.code || this.data.highlight.status === '已完成') {
      return;
    }

    if (!this.data.currentClaimPostId) {
      wx.showToast({
        title: '未找到当前认领任务',
        icon: 'none'
      });
      return;
    }

    this.setData({ completing: true });

    try {
      const result = await request<PlazaCompleteResponse>({
        url: `/plaza/posts/${this.data.currentClaimPostId}/complete`,
        method: 'POST'
      });

      this.setData({
        highlight: result.highlight || this.data.highlight
      });
      await this.loadPlazaFeed();

      wx.showToast({
        title: `已完成 +${result.pointsAwarded}`,
        icon: 'none'
      });
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '完成失败',
        icon: 'none'
      });
      console.error(error);
    } finally {
      this.setData({ completing: false });
    }
  },

  goToPage(event: WechatMiniprogram.BaseEvent) {
    const { path } = event.currentTarget.dataset as { path: string };
    if (!path) return;
    if (path === '/pages/home/index' || path === '/pages/plaza/index') {
      wx.reLaunch({ url: path });
      return;
    }
    wx.navigateTo({ url: path });
  },

  openVoiceAssistant() {
    wx.navigateTo({ url: '/pages/agent/index' });
  }
});
