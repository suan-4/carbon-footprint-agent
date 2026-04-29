const pool = require('../db/pool');
const mockStore = require('./mockStore');

const DEMO_OPEN_ID = 'demo-open-id';
const DEFAULT_LEVEL = '先锋绿色公民';
const DB_RETRY_WINDOW_MS = 10000;

let dbState = {
  available: false,
  checkedAt: 0
};

const BEHAVIOR_CATALOG = [
  { code: 'green_transit', name: '绿色出行', points: 6, carbonKg: 0.12 },
  { code: 'bring_cup', name: '自带水杯', points: 2, carbonKg: 0.04 },
  { code: 'bring_cutlery', name: '自带餐具', points: 4, carbonKg: 0.08 },
  { code: 'stairs_walk', name: '步行上楼', points: 2, carbonKg: 0.03 },
  { code: 'clean_plate', name: '光盘行动', points: 5, carbonKg: 0.15 },
  { code: 'paperless_note', name: '无纸笔记', points: 8, carbonKg: 0.2 }
];

const CARBON_FACTORS = {
  travel: {
    car: { factor: 0.21, unit: 'km', name: '驾车' },
    taxi: { factor: 0.18, unit: 'km', name: '打车' },
    bus: { factor: 0.08, unit: 'km', name: '公交' },
    subway: { factor: 0.04, unit: 'km', name: '地铁' },
    bicycle: { factor: 0, unit: 'km', name: '骑行' },
    walk: { factor: 0, unit: 'km', name: '步行' },
    electric_scooter: { factor: 0.02, unit: 'km', name: '电动自行车' }
  },
  electricity: {
    residential: { factor: 0.58, unit: 'kWh', name: '居民用电' },
    commercial: { factor: 0.72, unit: 'kWh', name: '商业用电' }
  }
};

const DEFAULT_PRODUCTS = [
  {
    name: '种子纸手账',
    category: 'physical',
    coverUrl: '',
    pointsCost: 450,
    stock: 100,
    redeemRule: '每月限兑 2 次',
    status: 1
  },
  {
    name: '环保帆布袋',
    category: 'physical',
    coverUrl: '',
    pointsCost: 600,
    stock: 80,
    redeemRule: '每月限兑 1 次',
    status: 1
  },
  {
    name: '图书馆延时券',
    category: 'virtual',
    coverUrl: '',
    pointsCost: 800,
    stock: 999,
    redeemRule: '试点期间可兑',
    status: 1
  },
  {
    name: 'Low Carbon Badge',
    category: 'badge',
    coverUrl: '',
    pointsCost: 120,
    stock: 9999,
    redeemRule: 'Auto granted after redeem',
    status: 1
  }
];

const PRODUCT_NAME_MAP = {
  1: '种子纸手账',
  2: '环保帆布袋',
  3: '图书馆延时券',
  4: 'Low Carbon Badge'
};

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function nowText() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function formatDateTime(value) {
  if (!value) return nowText();
  return new Date(value).toISOString().replace('T', ' ').slice(0, 19);
}

function getWeekLabel(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

function getRecentWeekDays() {
  return ['周一', '周二', '周三', '周四', '周五'];
}

function mapUserRow(row) {
  return {
    id: Number(row.id),
    nickname: row.nickname,
    avatarUrl: row.avatar_url || '',
    level: DEFAULT_LEVEL,
    totalPoints: Number(row.total_points || 0),
    totalCarbonKg: Number(row.total_carbon_kg || 0)
  };
}

function mapPointAccountRow(row) {
  return {
    balance: Number(row.balance || 0),
    updatedAt: formatDateTime(row.updated_at)
  };
}

function mapProductRow(row) {
  return {
    id: Number(row.id),
    name: PRODUCT_NAME_MAP[Number(row.id)] || row.name,
    category: row.category,
    pointsCost: Number(row.points_cost || 0),
    stock: Number(row.stock || 0)
  };
}

function mapOrderRow(row) {
  return {
    id: Number(row.id),
    orderNo: row.order_no,
    productId: Number(row.product_id),
    productName: row.product_name,
    category: row.category || 'physical',
    pointsCost: Number(row.points_cost || 0),
    status: row.status,
    createdAt: formatDateTime(row.created_at)
  };
}

async function isDbAvailable() {
  const now = Date.now();

  if (dbState.available && now - dbState.checkedAt < DB_RETRY_WINDOW_MS) {
    return true;
  }

  if (!dbState.available && now - dbState.checkedAt < DB_RETRY_WINDOW_MS) {
    return false;
  }

  try {
    await pool.query('SELECT 1');
    dbState = {
      available: true,
      checkedAt: now
    };
    return true;
  } catch (error) {
    dbState = {
      available: false,
      checkedAt: now
    };
    return false;
  }
}

async function ensurePointAccount(userId, totalPoints, connection = pool) {
  const [[accountRow]] = await connection.query(
    'SELECT id FROM point_accounts WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (!accountRow) {
    await connection.query(
      `
        INSERT INTO point_accounts (user_id, balance, frozen_balance, version)
        VALUES (?, ?, 0, 0)
      `,
      [userId, totalPoints]
    );
  }
}

async function ensureProducts(connection = pool) {
  const [[productCountRow]] = await connection.query(
    `
      SELECT COUNT(*) AS total
      FROM products
      WHERE status = 1
        AND category IN ('physical', 'virtual', 'badge')
    `
  );

  if (Number(productCountRow.total || 0)) {
    return;
  }

  for (const product of DEFAULT_PRODUCTS) {
    await connection.query(
      `
        INSERT INTO products (name, category, cover_url, points_cost, stock, redeem_rule, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        product.name,
        product.category,
        product.coverUrl,
        product.pointsCost,
        product.stock,
        product.redeemRule,
        product.status
      ]
    );
  }
}

async function ensureDemoData(connection = pool) {
  await connection.query(
    `
      INSERT INTO users (open_id, nickname, avatar_url, campus, total_points, total_carbon_kg, status)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        nickname = VALUES(nickname),
        avatar_url = VALUES(avatar_url),
        campus = VALUES(campus)
    `,
    [DEMO_OPEN_ID, '陈枝落', '', '主校区', 1284, 24.8]
  );

  const [[userRow]] = await connection.query(
    'SELECT id, total_points FROM users WHERE open_id = ? LIMIT 1',
    [DEMO_OPEN_ID]
  );

  if (!userRow) {
    throw createError('演示用户初始化失败', 500);
  }

  await ensurePointAccount(userRow.id, userRow.total_points, connection);
  await ensureProducts(connection);

  return Number(userRow.id);
}

async function getDemoUserId(connection = pool) {
  await ensureDemoData(connection);
  const [[row]] = await connection.query('SELECT id FROM users WHERE open_id = ? LIMIT 1', [DEMO_OPEN_ID]);

  if (!row) {
    throw createError('未找到演示用户', 500);
  }

  return Number(row.id);
}

async function resolveCurrentUserId(authUser, connection = pool) {
  if (authUser && authUser.id) {
    return Number(authUser.id);
  }

  return getDemoUserId(connection);
}

async function getCurrentUser(authUser) {
  if (!(await isDbAvailable())) {
    return mockStore.user;
  }

  const userId = await resolveCurrentUserId(authUser);
  const [[row]] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
  return mapUserRow(row);
}

async function getPointAccount(authUser) {
  if (!(await isDbAvailable())) {
    return mockStore.pointAccount;
  }

  const userId = await resolveCurrentUserId(authUser);
  const [[row]] = await pool.query('SELECT * FROM point_accounts WHERE user_id = ? LIMIT 1', [userId]);
  return mapPointAccountRow(row);
}

async function getBehaviorCatalog() {
  return BEHAVIOR_CATALOG;
}

async function getProducts() {
  if (!(await isDbAvailable())) {
    return mockStore.products;
  }

  await ensureProducts();
  const [rows] = await pool.query(
    `
      SELECT *
      FROM products
      WHERE status = 1
        AND category IN ('physical', 'virtual', 'badge')
      ORDER BY id ASC
    `
  );
  return rows.map(mapProductRow);
}

async function getRedemptionOrders(authUser) {
  if (!(await isDbAvailable())) {
    return mockStore.getRedemptionOrders ? mockStore.getRedemptionOrders() : [];
  }

  const userId = await resolveCurrentUserId(authUser);
  const [rows] = await pool.query(
    `
      SELECT o.*, p.category
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC, o.id DESC
    `,
    [userId]
  );

  return rows.map(mapOrderRow);
}

async function redeemProduct(productId, authUser) {
  if (!(await isDbAvailable())) {
    return mockStore.redeemProduct(productId);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const userId = await resolveCurrentUserId(authUser, connection);
    const [[accountRow]] = await connection.query(
      'SELECT * FROM point_accounts WHERE user_id = ? LIMIT 1 FOR UPDATE',
      [userId]
    );
    const [[productRow]] = await connection.query(
      `
        SELECT *
        FROM products
        WHERE id = ?
          AND status = 1
          AND category IN ('physical', 'virtual', 'badge')
        LIMIT 1
        FOR UPDATE
      `,
      [productId]
    );

    if (!productRow) {
      throw createError('未找到对应的商品', 404);
    }

    if (Number(productRow.stock) <= 0) {
      throw createError('当前商品库存不足');
    }

    if (Number(accountRow.balance) < Number(productRow.points_cost)) {
      throw createError('当前积分不足，无法兑换');
    }

    const nextBalance = Number(accountRow.balance) - Number(productRow.points_cost);
    const orderNo = `RD${Date.now()}${String(productRow.id).padStart(3, '0')}`;
    const orderStatus = productRow.category === 'physical' ? 'pending_pickup' : 'issued';

    await connection.query(
      'UPDATE point_accounts SET balance = ?, version = version + 1 WHERE id = ?',
      [nextBalance, accountRow.id]
    );
    await connection.query(
      'UPDATE users SET total_points = ? WHERE id = ?',
      [nextBalance, userId]
    );
    await connection.query(
      'UPDATE products SET stock = stock - 1 WHERE id = ?',
      [productRow.id]
    );

    const [orderResult] = await connection.query(
      `
        INSERT INTO orders (order_no, user_id, product_id, product_name, points_cost, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [orderNo, userId, productRow.id, PRODUCT_NAME_MAP[Number(productRow.id)] || productRow.name, productRow.points_cost, orderStatus]
    );

    await connection.query(
      `
        INSERT INTO point_logs (user_id, order_id, change_type, points_delta, balance_after, remark)
        VALUES (?, ?, 'spend', ?, ?, ?)
      `,
      [userId, orderResult.insertId, -Number(productRow.points_cost), nextBalance, `兑换商品：${productRow.name}`]
    );

    await connection.commit();

    const [[orderRow]] = await connection.query(
      `
        SELECT o.*, p.category
        FROM orders o
        LEFT JOIN products p ON p.id = o.product_id
        WHERE o.id = ?
        LIMIT 1
      `,
      [orderResult.insertId]
    );
    const [[updatedAccountRow]] = await connection.query(
      'SELECT * FROM point_accounts WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const [[updatedProductRow]] = await connection.query(
      'SELECT * FROM products WHERE id = ? LIMIT 1',
      [productRow.id]
    );
    const [productRows] = await connection.query(
      `
        SELECT *
        FROM products
        WHERE status = 1
          AND category IN ('physical', 'virtual', 'badge')
        ORDER BY id ASC
      `
    );

    return {
      order: mapOrderRow(orderRow),
      pointAccount: mapPointAccountRow(updatedAccountRow),
      product: mapProductRow(updatedProductRow),
      products: productRows.map(mapProductRow)
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function submitBehavior(payload = {}, authUser) {
  if (!(await isDbAvailable())) {
    return mockStore.submitBehavior(payload);
  }

  const matched = BEHAVIOR_CATALOG.find((item) => {
    return item.code === payload.behaviorCode || item.name === payload.behaviorName;
  });

  if (!matched) {
    throw createError('未找到对应的行为类型', 404);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const userId = await resolveCurrentUserId(authUser, connection);
    const [[accountRow]] = await connection.query(
      'SELECT * FROM point_accounts WHERE user_id = ? LIMIT 1 FOR UPDATE',
      [userId]
    );
    const [[userRow]] = await connection.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1 FOR UPDATE',
      [userId]
    );

    const carbonKg = Number(matched.carbonKg.toFixed(2));
    const pointsAwarded = Number(matched.points);
    const nextBalance = Number(accountRow.balance) + pointsAwarded;
    const nextTotalPoints = Number(userRow.total_points) + pointsAwarded;
    const nextCarbonKg = Number((Number(userRow.total_carbon_kg) + carbonKg).toFixed(2));

    const [recordResult] = await connection.query(
      `
        INSERT INTO behavior_records (
          user_id,
          behavior_code,
          behavior_name,
          description,
          audit_status,
          points_awarded,
          carbon_kg,
          occurred_at
        )
        VALUES (?, ?, ?, ?, 'approved', ?, ?, NOW())
      `,
      [userId, matched.code, matched.name, payload.description || '', pointsAwarded, carbonKg]
    );

    await connection.query(
      'UPDATE point_accounts SET balance = ?, version = version + 1 WHERE id = ?',
      [nextBalance, accountRow.id]
    );
    await connection.query(
      'UPDATE users SET total_points = ?, total_carbon_kg = ? WHERE id = ?',
      [nextTotalPoints, nextCarbonKg, userId]
    );
    await connection.query(
      `
        INSERT INTO point_logs (user_id, behavior_record_id, change_type, points_delta, balance_after, remark)
        VALUES (?, ?, 'earn', ?, ?, ?)
      `,
      [userId, recordResult.insertId, pointsAwarded, nextBalance, `行为打卡：${matched.name}`]
    );

    await connection.commit();

    const [[recordRow]] = await connection.query(
      'SELECT * FROM behavior_records WHERE id = ? LIMIT 1',
      [recordResult.insertId]
    );
    const [[updatedAccountRow]] = await connection.query(
      'SELECT * FROM point_accounts WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const [[updatedUserRow]] = await connection.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    return {
      record: {
        id: Number(recordRow.id),
        behaviorCode: recordRow.behavior_code,
        behaviorName: recordRow.behavior_name,
        pointsAwarded: Number(recordRow.points_awarded),
        carbonKg: Number(recordRow.carbon_kg),
        createdAt: formatDateTime(recordRow.created_at)
      },
      pointAccount: mapPointAccountRow(updatedAccountRow),
      user: mapUserRow(updatedUserRow),
      weeklyReport: await getWeeklyOverview(authUser)
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getWeeklyOverview(authUser) {
  if (!(await isDbAvailable())) {
    return mockStore.weeklyReport;
  }

  const userId = await resolveCurrentUserId(authUser);
  const weekDays = getRecentWeekDays();
  const [rows] = await pool.query(
    `
      SELECT behavior_name, points_awarded, carbon_kg, created_at
      FROM behavior_records
      WHERE user_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at ASC
    `,
    [userId]
  );

  if (!rows.length) {
    return {
      weekLabel: getWeekLabel(),
      carbonKg: 0,
      pointsEarned: 0,
      behaviorCount: 0,
      trend: weekDays.map((day) => ({ day, carbonKg: 0 }))
    };
  }

  const trendMap = new Map(weekDays.map((day) => [day, 0]));
  let totalCarbonKg = 0;
  let totalPoints = 0;

  rows.forEach((row) => {
    const date = new Date(row.created_at);
    const weekIndex = date.getDay();
    const dayMap = {
      1: '周一',
      2: '周二',
      3: '周三',
      4: '周四',
      5: '周五'
    };
    const day = dayMap[weekIndex];
    const carbonKg = Number(row.carbon_kg || 0);
    totalCarbonKg += carbonKg;
    totalPoints += Number(row.points_awarded || 0);

    if (day && trendMap.has(day)) {
      trendMap.set(day, Number((trendMap.get(day) + carbonKg).toFixed(2)));
    }
  });

  return {
    weekLabel: getWeekLabel(),
    carbonKg: Number(totalCarbonKg.toFixed(2)),
    pointsEarned: totalPoints,
    behaviorCount: rows.length,
    trend: weekDays.map((day) => ({
      day,
      carbonKg: Number((trendMap.get(day) || 0).toFixed(2))
    }))
  };
}

async function submitCarbonData(payload = {}, authUser) {
  if (!(await isDbAvailable())) {
    return {
      id: 1,
      dataType: payload.dataType,
      category: payload.category,
      value: payload.value,
      unit: payload.unit,
      carbonKg: payload.carbonKg,
      recordDate: payload.recordDate,
      createdAt: nowText()
    };
  }

  const { dataType, category, value, recordDate } = payload;

  if (!dataType || !category || !value || !recordDate) {
    throw createError('dataType, category, value, recordDate 必填');
  }

  const typeFactors = CARBON_FACTORS[dataType];
  if (!typeFactors) {
    throw createError('不支持的数据类型，仅支持 travel 和 electricity');
  }

  const categoryInfo = typeFactors[category];
  if (!categoryInfo) {
    throw createError(`不支持的 ${dataType} 类别`);
  }

  const carbonKg = Number((value * categoryInfo.factor).toFixed(2));
  const unit = categoryInfo.unit;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const userId = await resolveCurrentUserId(authUser, connection);

    const [insertResult] = await connection.query(
      `
        INSERT INTO carbon_data_entries (
          user_id, data_type, category, value, unit, carbon_kg, record_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [userId, dataType, category, value, unit, carbonKg, recordDate]
    );

    await connection.commit();

    return {
      id: insertResult.insertId,
      dataType,
      category,
      value,
      unit,
      carbonKg,
      recordDate,
      createdAt: nowText()
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getCarbonDataEntries(authUser, options = {}) {
  if (!(await isDbAvailable())) {
    return [];
  }

  const { dataType, startDate, endDate, limit = 50 } = options;
  const userId = await resolveCurrentUserId(authUser);

  let query = 'SELECT * FROM carbon_data_entries WHERE user_id = ?';
  const params = [userId];

  if (dataType) {
    query += ' AND data_type = ?';
    params.push(dataType);
  }

  if (startDate) {
    query += ' AND record_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND record_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY record_date DESC, created_at DESC LIMIT ?';
  params.push(limit);

  const [rows] = await pool.query(query, params);

  return rows.map((row) => ({
    id: Number(row.id),
    dataType: row.data_type,
    category: row.category,
    value: Number(row.value),
    unit: row.unit,
    carbonKg: Number(row.carbon_kg),
    recordDate: row.record_date.toISOString().split('T')[0],
    createdAt: formatDateTime(row.created_at)
  }));
}

async function getCarbonSummary(authUser) {
  if (!(await isDbAvailable())) {
    return { totalCarbonKg: 0, travelCarbonKg: 0, electricityCarbonKg: 0 };
  }

  const userId = await resolveCurrentUserId(authUser);

  const [[travelRow]] = await pool.query(
    'SELECT COALESCE(SUM(carbon_kg), 0) as total FROM carbon_data_entries WHERE user_id = ? AND data_type = ?',
    [userId, 'travel']
  );

  const [[electricityRow]] = await pool.query(
    'SELECT COALESCE(SUM(carbon_kg), 0) as total FROM carbon_data_entries WHERE user_id = ? AND data_type = ?',
    [userId, 'electricity']
  );

  const travelCarbonKg = Number(travelRow.total);
  const electricityCarbonKg = Number(electricityRow.total);

  return {
    totalCarbonKg: Number((travelCarbonKg + electricityCarbonKg).toFixed(2)),
    travelCarbonKg,
    electricityCarbonKg
  };
}

module.exports = {
  getCurrentUser,
  getPointAccount,
  getBehaviorCatalog,
  submitBehavior,
  getProducts,
  redeemProduct,
  getRedemptionOrders,
  getWeeklyOverview,
  isDbAvailable,
  ensureDemoData,
  resolveCurrentUserId,
  mapUserRow,
  submitCarbonData,
  getCarbonDataEntries,
  getCarbonSummary,
  CARBON_FACTORS
};
