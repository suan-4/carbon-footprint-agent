const store = {
  user: {
    id: 1,
    nickname: '陈枝落',
    avatarUrl: '',
    level: '先锋绿色公民',
    totalPoints: 1284,
    totalCarbonKg: 24.8
  },
  pointAccount: {
    balance: 1284,
    updatedAt: '2026-03-30 23:30:00'
  },
  redemptionOrders: [],
  behaviorCatalog: [
    { code: 'green_transit', name: '绿色出行', points: 6, carbonKg: 0.12 },
    { code: 'bring_cup', name: '自带水杯', points: 2, carbonKg: 0.04 },
    { code: 'bring_cutlery', name: '自带餐具', points: 4, carbonKg: 0.08 },
    { code: 'stairs_walk', name: '步行上楼', points: 2, carbonKg: 0.03 },
    { code: 'clean_plate', name: '光盘行动', points: 5, carbonKg: 0.15 },
    { code: 'paperless_note', name: '无纸笔记', points: 8, carbonKg: 0.2 }
  ],
  behaviorRecords: [],
  products: [
    { id: 1, name: '种子纸手账', category: 'physical', pointsCost: 450, stock: 100 },
    { id: 2, name: '环保帆布袋', category: 'physical', pointsCost: 600, stock: 80 },
    { id: 3, name: '图书馆延时券', category: 'virtual', pointsCost: 800, stock: 999 },
    { id: 4, name: 'Low Carbon Badge', category: 'badge', pointsCost: 120, stock: 9999 }
  ],
  plazaPosts: [
    {
      id: 1,
      type: 'help',
      title: '顺路带午餐到图书馆',
      meta: '校园互助 · 3 分钟前',
      desc: '在西苑食堂二楼，顺路帮带一份轻食到图书馆三楼自习区，匿名对接即可。',
      reward: '+2',
      tags: ['食堂区域', '紧急', '匿名发布'],
      icon: '/assets/icons/happy.svg',
      iconClass: 'plaza-post-icon-green'
    },
    {
      id: 2,
      type: 'help',
      title: '代扔可回收纸箱',
      meta: '校园互助 · 15 分钟前',
      desc: '宿舍楼下可回收箱已满，希望顺路带到生活区总回收点，主要是干净纸箱。',
      reward: '+1',
      tags: ['生活区', '可回收', '顺路任务'],
      icon: '/assets/icons/recycle.svg',
      iconClass: 'plaza-post-icon-blue'
    },
    {
      id: 3,
      type: 'book',
      title: '高等数学教材转让',
      meta: '教材流转 · 28 分钟前',
      desc: '同版教材九成新，支持按 ISBN 搜索匹配，优先本校面交，减少重复购买。',
      reward: '+10',
      tags: ['教材转让', '线下面交', '可议价'],
      icon: '/assets/icons/note.svg',
      iconClass: 'plaza-post-icon-yellow'
    }
  ],
  plazaClaims: [],
  plazaHighlight: {
    code: 'GH2025',
    desc: '你已成功认领一项顺路互助任务，请凭对接码在指定区域联系发布者。',
    status: '进行中'
  },
  weeklyReport: {
    weekLabel: '2026-W13',
    carbonKg: 24.8,
    pointsEarned: 126,
    behaviorCount: 18,
    trend: [
      { day: '周一', carbonKg: 2.1 },
      { day: '周二', carbonKg: 3.5 },
      { day: '周三', carbonKg: 4.0 },
      { day: '周四', carbonKg: 3.2 },
      { day: '周五', carbonKg: 5.4 }
    ]
  },

  createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  },

  getNowText() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  },

  createOrderNo() {
    const timestamp = Date.now().toString().slice(-8);
    const suffix = String(this.redemptionOrders.length + 1).padStart(3, '0');
    return `RD${timestamp}${suffix}`;
  },

  createPlazaClaimCode() {
    const suffix = String(this.plazaClaims.length + 1).padStart(3, '0');
    return `GH${new Date().getFullYear()}${suffix}`;
  },

  getRedemptionOrders() {
    return this.redemptionOrders;
  },

  getPlazaFeed(filter = 'all') {
    const openPosts = this.plazaPosts.filter((item) => item.status !== 'closed' && item.status !== 'claimed');
    const posts = filter === 'all' ? openPosts : openPosts.filter((item) => item.type === filter);

    return {
      anonymousMode: true,
      currentClaimPostId: this.plazaClaims[0] ? this.plazaClaims[0].postId : 0,
      highlight: this.plazaHighlight,
      posts
    };
  },

  claimPlazaPost(productId) {
    const matchedPost = this.plazaPosts.find((item) => item.id === Number(productId));

    if (!matchedPost) {
      throw this.createError('未找到对应的广场需求', 404);
    }

    const existingClaim = this.plazaClaims.find((item) => item.postId === matchedPost.id);
    const claimCode = existingClaim ? existingClaim.claimCode : this.createPlazaClaimCode();

    if (!existingClaim) {
      this.plazaClaims.unshift({
        id: this.plazaClaims.length + 1,
        postId: matchedPost.id,
        claimCode,
        status: 'claimed',
        createdAt: this.getNowText()
      });
      matchedPost.status = 'claimed';
    }

    this.plazaHighlight = {
      code: claimCode,
      desc: `你已成功认领“${matchedPost.title}”，请凭对接码在指定区域联系发布者。`,
      status: '进行中'
    };

    return {
      postId: matchedPost.id,
      title: matchedPost.title,
      claimCode,
      highlight: this.plazaHighlight
    };
  },

  completePlazaPost(postId) {
    const matchedClaim = this.plazaClaims.find((item) => item.postId === Number(postId));
    const matchedPost = this.plazaPosts.find((item) => item.id === Number(postId));

    if (!matchedClaim || !matchedPost) {
      throw this.createError('该需求尚未被当前用户认领', 404);
    }

    const pointsAwarded = Number(String(matchedPost.reward || '+0').replace('+', ''));

    matchedClaim.status = 'completed';
    matchedPost.status = 'closed';
    this.pointAccount.balance += pointsAwarded;
    this.pointAccount.updatedAt = this.getNowText();
    this.user.totalPoints = this.pointAccount.balance;
    this.plazaHighlight = {
      code: matchedClaim.claimCode,
      desc: `你已完成“${matchedPost.title}”，积分已入账。`,
      status: '已完成'
    };

    return {
      postId: matchedPost.id,
      title: matchedPost.title,
      claimCode: matchedClaim.claimCode,
      pointsAwarded,
      pointAccount: {
        balance: this.pointAccount.balance
      },
      highlight: this.plazaHighlight
    };
  },

  redeemProduct(productId) {
    const matchedProduct = this.products.find((item) => item.id === productId);

    if (!matchedProduct) {
      throw this.createError('未找到对应的商品', 404);
    }

    if (matchedProduct.stock <= 0) {
      throw this.createError('当前商品库存不足');
    }

    if (this.pointAccount.balance < matchedProduct.pointsCost) {
      throw this.createError('当前积分不足，无法兑换');
    }

    const nowText = this.getNowText();

    matchedProduct.stock -= 1;
    this.pointAccount.balance -= matchedProduct.pointsCost;
    this.pointAccount.updatedAt = nowText;
    this.user.totalPoints = this.pointAccount.balance;

    const order = {
      id: this.redemptionOrders.length + 1,
      orderNo: this.createOrderNo(),
      productId: matchedProduct.id,
      productName: matchedProduct.name,
      category: matchedProduct.category,
      pointsCost: matchedProduct.pointsCost,
      status: matchedProduct.category === 'physical' ? 'pending_pickup' : 'issued',
      createdAt: nowText
    };

    this.redemptionOrders.unshift(order);

    return {
      order,
      pointAccount: this.pointAccount,
      product: matchedProduct,
      products: this.products
    };
  },

  submitBehavior(payload = {}) {
    const matched = this.behaviorCatalog.find((item) => {
      return item.code === payload.behaviorCode || item.name === payload.behaviorName;
    });

    if (!matched) {
      throw this.createError('未找到对应的行为类型', 404);
    }

    const nowText = this.getNowText();
    const carbonKg = Number(matched.carbonKg.toFixed(2));
    const totalCarbonKg = Number((this.user.totalCarbonKg + carbonKg).toFixed(2));
    const weeklyCarbonKg = Number((this.weeklyReport.carbonKg + carbonKg).toFixed(2));

    this.user.totalPoints += matched.points;
    this.user.totalCarbonKg = totalCarbonKg;
    this.pointAccount.balance += matched.points;
    this.pointAccount.updatedAt = nowText;
    this.weeklyReport.pointsEarned += matched.points;
    this.weeklyReport.behaviorCount += 1;
    this.weeklyReport.carbonKg = weeklyCarbonKg;

    if (this.weeklyReport.trend.length) {
      const lastTrendItem = this.weeklyReport.trend[this.weeklyReport.trend.length - 1];
      lastTrendItem.carbonKg = Number((lastTrendItem.carbonKg + carbonKg).toFixed(2));
    }

    const record = {
      id: this.behaviorRecords.length + 1,
      behaviorCode: matched.code,
      behaviorName: matched.name,
      pointsAwarded: matched.points,
      carbonKg,
      createdAt: nowText
    };

    this.behaviorRecords.unshift(record);

    return {
      record,
      pointAccount: this.pointAccount,
      user: this.user,
      weeklyReport: this.weeklyReport
    };
  }
};

module.exports = store;
