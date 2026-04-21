const crypto = require('crypto');
const pool = require('../db/pool');
const env = require('../config/env');
const appDataService = require('./appDataService');
const mockStore = require('./mockStore');

const SESSION_TTL_DAYS = 30;
const DEFAULT_CAMPUS = '主校区';
const DEV_OPEN_ID_PREFIX = 'dev-open-id:';

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function mapUserRow(row) {
  return {
    id: Number(row.id),
    nickname: row.nickname,
    avatarUrl: row.avatar_url || '',
    level: '先锋绿色公民',
    totalPoints: Number(row.total_points || 0),
    totalCarbonKg: Number(row.total_carbon_kg || 0)
  };
}

function createSessionToken() {
  return crypto.randomBytes(24).toString('hex');
}

function getExpiresAtText() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt.toISOString().replace('T', ' ').slice(0, 19);
}

function normalizeProfile(profile = {}) {
  return {
    nickname: String(profile.nickname || '').trim() || '校园用户',
    avatarUrl: String(profile.avatarUrl || '').trim(),
    campus: String(profile.campus || DEFAULT_CAMPUS).trim() || DEFAULT_CAMPUS
  };
}

function buildDevOpenId(deviceId) {
  const normalizedDeviceId = String(deviceId || 'demo-device').trim() || 'demo-device';
  return `${DEV_OPEN_ID_PREFIX}${normalizedDeviceId}`;
}

async function ensureAuthTables(connection = pool) {
  await connection.query(
    `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT 'primary key',
        user_id BIGINT UNSIGNED NOT NULL COMMENT 'user id',
        session_token VARCHAR(128) NOT NULL COMMENT 'session token',
        login_mode VARCHAR(32) NOT NULL DEFAULT 'dev' COMMENT 'wechat or dev',
        expires_at DATETIME NOT NULL COMMENT 'session expire time',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_user_sessions_token (session_token),
        INDEX idx_user_sessions_user (user_id),
        CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id)
      ) COMMENT='user sessions'
    `
  );
}

async function ensurePointAccount(userId, totalPoints, connection = pool) {
  const [[pointRow]] = await connection.query(
    'SELECT id FROM point_accounts WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (!pointRow) {
    await connection.query(
      `
        INSERT INTO point_accounts (user_id, balance, frozen_balance, version)
        VALUES (?, ?, 0, 0)
      `,
      [userId, Number(totalPoints || 0)]
    );
  }
}

async function upsertUserByOpenId(payload, connection = pool) {
  const profile = normalizeProfile(payload.profile);

  await connection.query(
    `
      INSERT INTO users (open_id, union_id, nickname, avatar_url, campus, total_points, total_carbon_kg, status)
      VALUES (?, ?, ?, ?, ?, 0, 0, 1)
      ON DUPLICATE KEY UPDATE
        union_id = VALUES(union_id),
        nickname = VALUES(nickname),
        avatar_url = VALUES(avatar_url),
        campus = VALUES(campus)
    `,
    [payload.openId, payload.unionId || null, profile.nickname, profile.avatarUrl, profile.campus]
  );

  const [[userRow]] = await connection.query(
    'SELECT * FROM users WHERE open_id = ? LIMIT 1',
    [payload.openId]
  );

  if (!userRow) {
    throw createError('登录用户初始化失败', 500);
  }

  await ensurePointAccount(userRow.id, userRow.total_points, connection);

  return userRow;
}

async function exchangeCodeForOpenId(code) {
  if (!env.wechat.appId || !env.wechat.appSecret || !code) {
    return null;
  }

  const params = new URLSearchParams({
    appid: env.wechat.appId,
    secret: env.wechat.appSecret,
    js_code: code,
    grant_type: 'authorization_code'
  });

  const response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${params.toString()}`);
  const data = await response.json();

  if (!response.ok || data.errcode) {
    throw createError(data.errmsg || '微信登录失败', 502);
  }

  if (!data.openid) {
    throw createError('微信登录返回缺少 openid', 502);
  }

  return {
    openId: data.openid,
    unionId: data.unionid || null,
    mode: 'wechat'
  };
}

async function login(payload = {}) {
  if (!(await appDataService.isDbAvailable())) {
    return {
      token: 'demo-token',
      mode: 'mock',
      user: mockStore.user
    };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await appDataService.ensureDemoData(connection);
    await ensureAuthTables(connection);

    let authResult = null;

    if (payload.code && env.wechat.appId && env.wechat.appSecret) {
      authResult = await exchangeCodeForOpenId(payload.code);
    }

    if (!authResult) {
      authResult = {
        openId: buildDevOpenId(payload.deviceId),
        unionId: null,
        mode: 'dev'
      };
    }

    const userRow = await upsertUserByOpenId(
      {
        openId: authResult.openId,
        unionId: authResult.unionId,
        profile: payload.profile
      },
      connection
    );

    const sessionToken = createSessionToken();

    await connection.query(
      `
        INSERT INTO user_sessions (user_id, session_token, login_mode, expires_at)
        VALUES (?, ?, ?, ?)
      `,
      [userRow.id, sessionToken, authResult.mode, getExpiresAtText()]
    );

    await connection.commit();

    return {
      token: sessionToken,
      mode: authResult.mode,
      user: mapUserRow(userRow)
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getSessionUser(sessionToken) {
  if (!sessionToken) {
    return null;
  }

  if (!(await appDataService.isDbAvailable())) {
    if (sessionToken === 'demo-token') {
      return {
        ...mockStore.user,
        openId: 'demo-open-id',
        loginMode: 'mock'
      };
    }
    return null;
  }

  await ensureAuthTables();

  const [[row]] = await pool.query(
    `
      SELECT
        s.login_mode,
        u.*
      FROM user_sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ?
        AND s.expires_at > NOW()
      LIMIT 1
    `,
    [sessionToken]
  );

  if (!row) {
    return null;
  }

  return {
    ...mapUserRow(row),
    openId: row.open_id,
    loginMode: row.login_mode
  };
}

async function logout(sessionToken) {
  if (!sessionToken) {
    return;
  }

  if (!(await appDataService.isDbAvailable())) {
    return;
  }

  await ensureAuthTables();
  await pool.query('DELETE FROM user_sessions WHERE session_token = ?', [sessionToken]);
}

module.exports = {
  login,
  logout,
  getSessionUser,
  ensureAuthTables
};
