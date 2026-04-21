import { request } from '../../utils/request';

type PointAccountResponse = {
  balance: number;
  updatedAt: string;
};

type RedemptionOrder = {
  id: number;
  orderNo: string;
  productId: number;
  productName: string;
  category: string;
  pointsCost: number;
  status: string;
  createdAt: string;
};

type RedemptionOrderView = RedemptionOrder & {
  statusText: string;
  statusClass: string;
};

Page({
  data: {
    loading: false,
    balance: 0,
    orders: [] as RedemptionOrderView[]
  },

  onShow() {
    this.loadRedemptionData();
  },

  mapOrder(order: RedemptionOrder): RedemptionOrderView {
    const isIssued = order.status === 'issued';
    return {
      ...order,
      statusText: isIssued ? '已发放' : '待领取',
      statusClass: isIssued ? 'redemption-status-issued' : 'redemption-status-pending'
    };
  },

  async loadRedemptionData() {
    this.setData({ loading: true });

    try {
      const [pointAccount, orders] = await Promise.all([
        request<PointAccountResponse>({ url: '/users/me/points' }),
        request<RedemptionOrder[]>({ url: '/users/me/redemptions' })
      ]);

      this.setData({
        balance: pointAccount?.balance || 0,
        orders: (orders || []).map((item) => this.mapOrder(item))
      });
    } catch (error) {
      wx.showToast({
        title: '兑换记录加载失败',
        icon: 'none'
      });
      console.error(error);
    } finally {
      this.setData({ loading: false });
    }
  },

  onPullDownRefresh() {
    this.loadRedemptionData().finally(() => wx.stopPullDownRefresh());
  },

  goBack() {
    wx.navigateBack();
  },

  goMall() {
    wx.navigateTo({ url: '/pages/mall/index' });
  }
});
