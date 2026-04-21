const pool = require('../db/pool');
const mockStore = require('./mockStore');
const appDataService = require('./appDataService');

const DEMO_OPEN_ID = 'demo-open-id';

const DEFAULT_PLAZA_POSTS = [
  {
    type: 'help',
    title: '顺路带午餐到图书馆',
    metaText: '校园互助 · 3 分钟前',
    description: '在西苑食堂二楼，顺路帮带一份轻食到图书馆三楼自习区，匿名对接即可。',
    rewardPoints: 2,
    tags: ['食堂区域', '紧急', '匿名发布'],
    icon: '/assets/icons/happy.svg',
    iconClass: 'plaza-post-icon-green',
    status: 'open'
  },
  {
    type: 'help',
    title: '代扔可回收纸箱',
    metaText: '校园互助 · 15 分钟前',
    description: '宿舍楼下可回收箱已满，希望顺路带到生活区总回收点，主要是干净纸箱。',
    rewardPoints: 1,
    tags: ['生活区', '可回收', '顺路任务'],
    icon: '/assets/icons/recycle.svg',
    iconClass: 'plaza-post-icon-blue',
    status: 'open'
  },
  {
    type: 'book',
    title: '高等数学教材转让',
    metaText: '教材流转 · 28 分钟前',
    description: '同版教材九成新，支持按 ISBN 搜索匹配，优先本校面交，减少重复购买。',
    rewardPoints: 10,
    tags: ['教材转让', '线下面交', '可议价'],
    icon: '/assets/icons/note.svg',
    iconClass: 'plaza-post-icon-yellow',
    status: 'open'
  }
];

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseTags(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function mapPostRow(row) {
  return {
    id: Number(row.id),
    type: row.post_type,
    title: row.title,
    meta: row.meta_text,
    desc: row.description,
    reward: `+${Number(row.reward_points || 0)}`,
    tags: parseTags(row.tags_json),
    icon: row.icon,
    iconClass: row.icon_class
  };
}

async function ensurePlazaData(connection = pool) {
  const [[countRow]] = await connection.query(
    `
      SELECT COUNT(*) AS total
      FROM plaza_posts
      WHERE status = 'open'
    `
  );

  if (Number(countRow.total || 0)) {
    return;
  }

  for (const post of DEFAULT_PLAZA_POSTS) {
    await connection.query(
      `
        INSERT INTO plaza_posts (
          post_type,
          title,
          meta_text,
          description,
          reward_points,
          tags_json,
          icon,
          icon_class,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        post.type,
        post.title,
        post.metaText,
        post.description,
        post.rewardPoints,
        JSON.stringify(post.tags),
        post.icon,
        post.iconClass,
        post.status
      ]
    );
  }
}

async function getDemoUserId(connection = pool) {
  const [[row]] = await connection.query('SELECT id FROM users WHERE open_id = ? LIMIT 1', [DEMO_OPEN_ID]);

  if (!row) {
    throw createError('未找到演示用户，无法认领广场需求', 500);
  }

  return Number(row.id);
}

function buildHighlightFromClaim(row) {
  if (!row) {
    return {
      code: 'GH2025',
      desc: '你已成功认领一项顺路互助任务，请凭对接码在指定区域联系发布者。',
      status: '进行中'
    };
  }

  return {
    code: row.claim_code,
    desc: `你已成功认领“${row.title}”，请凭对接码在指定区域联系发布者。`,
    status: row.status === 'claimed' ? '进行中' : '待处理'
  };
}

async function getPlazaFeed(filter = 'all', authUser) {
  const normalizedFilter = filter === 'help' || filter === 'book' ? filter : 'all';

  if (!(await appDataService.isDbAvailable())) {
    return mockStore.getPlazaFeed(normalizedFilter);
  }

  await ensurePlazaData();

  const queryParams = [];
  let filterSql = '';

  if (normalizedFilter !== 'all') {
    filterSql = 'AND post_type = ?';
    queryParams.push(normalizedFilter);
  }

  const [rows] = await pool.query(
    `
      SELECT id, post_type, title, meta_text, description, reward_points, tags_json, icon, icon_class
      FROM plaza_posts
      WHERE status = 'open'
        ${filterSql}
      ORDER BY id ASC
    `,
    queryParams
  );

  const userId = await appDataService.resolveCurrentUserId(authUser);
  const [[claimRow]] = await pool.query(
    `
      SELECT c.post_id, c.claim_code, c.status, p.title
      FROM plaza_claims c
      INNER JOIN plaza_posts p ON p.id = c.post_id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC, c.id DESC
      LIMIT 1
    `,
    [userId]
  );

  return {
    anonymousMode: true,
    currentClaimPostId: claimRow ? Number(claimRow.post_id || 0) : 0,
    highlight: buildHighlightFromClaim(claimRow),
    posts: rows.map(mapPostRow)
  };
}

async function claimPlazaPost(postId, authUser) {
  if (!(await appDataService.isDbAvailable())) {
    return mockStore.claimPlazaPost(postId);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await ensurePlazaData(connection);

    const userId = await appDataService.resolveCurrentUserId(authUser, connection);
    const [[postRow]] = await connection.query(
      `
        SELECT id, title
        FROM plaza_posts
        WHERE id = ?
          AND status = 'open'
        LIMIT 1
        FOR UPDATE
      `,
      [postId]
    );

    if (!postRow) {
      throw createError('未找到对应的广场需求', 404);
    }

    const [[existingClaim]] = await connection.query(
      `
        SELECT id, claim_code
        FROM plaza_claims
        WHERE user_id = ?
          AND post_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [userId, postId]
    );

    let claimCode = existingClaim ? existingClaim.claim_code : '';

    if (!existingClaim) {
      claimCode = `GH${new Date().getFullYear()}${String(Date.now()).slice(-3)}`;

      await connection.query(
        `
          INSERT INTO plaza_claims (user_id, post_id, claim_code, status)
          VALUES (?, ?, ?, 'claimed')
        `,
        [userId, postId, claimCode]
      );

      await connection.query(
        `
          UPDATE plaza_posts
          SET status = 'claimed'
          WHERE id = ?
        `,
        [postId]
      );
    }

    await connection.commit();

    return {
      postId: Number(postRow.id),
      title: postRow.title,
      claimCode,
      highlight: buildHighlightFromClaim({
        claim_code: claimCode,
        status: 'claimed',
        title: postRow.title
      })
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function completePlazaPost(postId, authUser) {
  if (!(await appDataService.isDbAvailable())) {
    return mockStore.completePlazaPost(postId);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const userId = await appDataService.resolveCurrentUserId(authUser, connection);
    const [[claimRow]] = await connection.query(
      `
        SELECT c.id, c.status, c.claim_code, p.title, p.reward_points
        FROM plaza_claims c
        INNER JOIN plaza_posts p ON p.id = c.post_id
        WHERE c.user_id = ?
          AND c.post_id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [userId, postId]
    );

    if (!claimRow) {
      throw createError('该需求尚未被当前用户认领', 404);
    }

    const [[accountRow]] = await connection.query(
      'SELECT * FROM point_accounts WHERE user_id = ? LIMIT 1 FOR UPDATE',
      [userId]
    );

    if (claimRow.status === 'completed') {
      await connection.commit();

      return {
        postId: Number(postId),
        title: claimRow.title,
        claimCode: claimRow.claim_code,
        pointsAwarded: Number(claimRow.reward_points || 0),
        pointAccount: {
          balance: Number(accountRow.balance || 0)
        },
        highlight: {
          code: claimRow.claim_code,
          desc: `你已完成“${claimRow.title}”，积分已入账。`,
          status: '已完成'
        }
      };
    }

    const [[userRow]] = await connection.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1 FOR UPDATE',
      [userId]
    );

    const pointsAwarded = Number(claimRow.reward_points || 0);
    const nextBalance = Number(accountRow.balance || 0) + pointsAwarded;
    const nextTotalPoints = Number(userRow.total_points || 0) + pointsAwarded;

    await connection.query(
      `
        UPDATE plaza_claims
        SET status = 'completed'
        WHERE id = ?
      `,
      [claimRow.id]
    );
    await connection.query(
      `
        UPDATE plaza_posts
        SET status = 'closed'
        WHERE id = ?
      `,
      [postId]
    );
    await connection.query(
      'UPDATE point_accounts SET balance = ?, version = version + 1 WHERE id = ?',
      [nextBalance, accountRow.id]
    );
    await connection.query(
      'UPDATE users SET total_points = ? WHERE id = ?',
      [nextTotalPoints, userId]
    );
    await connection.query(
      `
        INSERT INTO point_logs (user_id, change_type, points_delta, balance_after, remark)
        VALUES (?, 'earn', ?, ?, ?)
      `,
      [userId, pointsAwarded, nextBalance, `广场互助完成：${claimRow.title}`]
    );

    await connection.commit();

    return {
      postId: Number(postId),
      title: claimRow.title,
      claimCode: claimRow.claim_code,
      pointsAwarded,
      pointAccount: {
        balance: nextBalance
      },
      highlight: {
        code: claimRow.claim_code,
        desc: `你已完成“${claimRow.title}”，积分已入账。`,
        status: '已完成'
      }
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getPlazaFeed,
  claimPlazaPost,
  completePlazaPost
};
