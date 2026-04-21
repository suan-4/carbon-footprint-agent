const { request } = require('../../utils/request');

const PRODUCT_META = {
  1: {
    name: '种子纸手账',
    desc: '再生纸封面里藏着花草种子，写满之后还能继续生长。',
    hint: '适合线下领取',
    icon: '/assets/icons/leaf.svg'
  },
  2: {
    name: '环保帆布袋',
    desc: '日常通勤和校园采购都能复用，减少一次性塑料袋使用。',
    hint: '适合宿舍常备',
    icon: '/assets/icons/bag.svg'
  },
  3: {
    name: '图书馆延时券',
    desc: '一键兑换自习权益，适合考试周或项目冲刺时使用。',
    hint: '兑换后自动发放',
    icon: '/assets/icons/note.svg'
  },
  4: {
    name: '低碳徽章',
    desc: '用于展示你的低碳行动成果，兑换后即时发放到个人账户。',
    hint: '兑换后自动点亮',
    icon: '/assets/icons/verified.svg'
  }
};

Page({
  data: {
    loading: false,
    balance: 1284,
    redeemableCount: 0,
    redeemingId: null,
    redeemToast: {
      visible: false,
      title: '',
      orderNo: '',
      balance: 0
    },
    featured: {
      id: 1,
      badge: 'LIMITED REWARD',
      name: '种子纸手账',
      desc: '从一次记录开始，把低碳行动真正留在每天的生活里。',
      stock: 100,
      typeLabel: '实体好物',
      pointsCost: 450,
      icon: '/assets/icons/leaf.svg',
      canRedeem: true,
      buttonText: '立即兑换'
    },
    products: [],
    guideSteps: [
      {
        title: '先积累积分',
        desc: '通过日志打卡、完成低碳行为和每周挑战持续获得积分。'
      },
      {
        title: '选择权益兑换',
        desc: '商城会根据你的积分和商品库存，实时显示是否可兑换。'
      },
      {
        title: '生成兑换订单',
        desc: '现在点击兑换会真实扣积分和库存，后续再补订单页与核销状态。'
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
    this.loadMallData();
  },

  normalizeProduct(product, balance) {
    const meta = PRODUCT_META[product.id] || {
      name: product.name || '校园权益',
      desc: '可用于兑换低碳激励权益。',
      hint: '兑换后请留意账户通知',
      icon: '/assets/icons/happy.svg'
    };
    const isVirtual = product.category === 'virtual';
    const isBadge = product.category === 'badge';
    const canAfford = balance >= (product.pointsCost || 0);
    const hasStock = (product.stock || 0) > 0;
    const canRedeem = canAfford && hasStock;

    return {
      ...product,
      name: meta.name,
      desc: meta.desc,
      hint: meta.hint,
      icon: meta.icon,
      typeLabel: isBadge ? '徽章权益' : isVirtual ? '虚拟权益' : '实体好物',
      pillClass: isBadge ? 'mall-pill-badge' : isVirtual ? 'mall-pill-virtual' : 'mall-pill-physical',
      categoryClass: isBadge ? 'mall-category-badge' : isVirtual ? 'mall-category-virtual' : 'mall-category-physical',
      canAfford,
      canRedeem,
      buttonText: !hasStock ? '已兑完' : canAfford ? '兑换' : '积分不足'
    };
  },

  async loadMallData() {
    this.setData({ loading: true });

    try {
      const [pointAccountRes, productsRes] = await Promise.all([
        request({ url: '/users/me/points' }),
        request({ url: '/products' })
      ]);

      const balance = pointAccountRes.balance || 0;
      const normalizedProducts = (productsRes || []).map((item) => this.normalizeProduct(item, balance));
      const featured = normalizedProducts[0];
      const redeemableCount = normalizedProducts.filter((item) => item.canRedeem).length;

      this.setData({
        balance,
        redeemableCount,
        products: normalizedProducts,
        featured: featured
          ? {
              id: featured.id,
              badge: featured.category === 'badge'
                ? 'BADGE REWARD'
                : featured.category === 'virtual'
                  ? 'INSTANT REWARD'
                  : 'LIMITED REWARD',
              name: featured.name,
              desc: featured.desc,
              stock: featured.stock,
              typeLabel: featured.typeLabel,
              pointsCost: featured.pointsCost,
              icon: featured.icon,
              canRedeem: featured.canRedeem,
              buttonText: featured.canRedeem ? '立即兑换' : featured.buttonText
            }
          : this.data.featured
      });
    } catch (error) {
      wx.showToast({
        title: '商城数据加载失败',
        icon: 'none'
      });
      console.error(error);
    } finally {
      this.setData({ loading: false });
    }
  },

  onPullDownRefresh() {
    this.loadMallData().finally(() => wx.stopPullDownRefresh());
  },

  hideRedeemToast() {
    this.setData({
      redeemToast: {
        visible: false,
        title: '',
        orderNo: '',
        balance: 0
      }
    });
  },

  goToPage(event) {
    const { path } = event.currentTarget.dataset;
    if (!path) return;
    if (path === '/pages/home/index' || path === '/pages/mall/index') {
      wx.reLaunch({ url: path });
      return;
    }
    wx.navigateTo({ url: path });
  },

  async redeemProduct(event) {
    const { id, name, cost } = event.currentTarget.dataset;

    if (!id) return;

    const matchedProduct =
      this.data.products.find((item) => item.id === id) || (this.data.featured.id === id ? this.data.featured : null);

    if (matchedProduct && matchedProduct.stock <= 0) {
      wx.showToast({
        title: '该商品已兑完',
        icon: 'none'
      });
      return;
    }

    if ((cost || 0) > this.data.balance) {
      wx.showToast({
        title: '当前积分不足',
        icon: 'none'
      });
      return;
    }

    this.setData({ redeemingId: id });

    try {
      const result = await request({
        url: `/products/${id}/redeem`,
        method: 'POST'
      });

      await this.loadMallData();

      this.setData({
        redeemToast: {
          visible: true,
          title: `${name} 已加入兑换记录`,
          orderNo: result.order.orderNo,
          balance: result.pointAccount.balance
        }
      });

      setTimeout(() => {
        if (this.data.redeemToast.visible && this.data.redeemToast.orderNo === result.order.orderNo) {
          this.hideRedeemToast();
        }
      }, 2200);
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '兑换失败',
        icon: 'none'
      });
      console.error(error);
    } finally {
      this.setData({ redeemingId: null });
    }
  }
});
