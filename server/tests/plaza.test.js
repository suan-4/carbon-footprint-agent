const { test, after } = require('node:test');
const assert = require('node:assert/strict');

const app = require('../src/app');
const pool = require('../src/db/pool');

async function createServer() {
  return await new Promise((resolve) => {
    const server = app.listen(0, () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`
      });
    });
  });
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();

  return {
    status: response.status,
    body
  };
}

async function createLoggedInUser(baseUrl, deviceId, nickname) {
  const result = await requestJson(baseUrl, '/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceId,
      profile: {
        nickname
      }
    })
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.code, 0);

  return result.body.data;
}

after(async () => {
  try {
    await pool.end();
  } catch (error) {
  }
});

test('POST /api/plaza/posts/:id/claim writes claim to the logged-in user', async () => {
  const { server, baseUrl } = await createServer();

  try {
    const loginResult = await createLoggedInUser(baseUrl, 'test-device-plaza-claim', '广场认领测试用户');
    const authUser = loginResult.user;

    const [postResult] = await pool.query(
      `
        INSERT INTO plaza_posts (post_type, title, meta_text, description, reward_points, tags_json, icon, icon_class, status)
        VALUES ('help', '测试认领需求', '测试元信息', '测试描述', 2, JSON_ARRAY('测试'), '/assets/icons/happy.svg', 'plaza-post-icon-green', 'open')
      `
    );

    const postId = Number(postResult.insertId);

    const claimResult = await requestJson(baseUrl, `/api/plaza/posts/${postId}/claim`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginResult.token}`
      }
    });

    assert.equal(claimResult.status, 200);
    assert.equal(claimResult.body.code, 0);

    const [[claimRow]] = await pool.query(
      'SELECT user_id, post_id FROM plaza_claims WHERE post_id = ? ORDER BY id DESC LIMIT 1',
      [postId]
    );

    assert.ok(claimRow);
    assert.equal(Number(claimRow.post_id), postId);
    assert.equal(Number(claimRow.user_id), Number(authUser.id));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('GET /api/plaza/feed returns highlight for the logged-in user instead of demo user', async () => {
  const { server, baseUrl } = await createServer();

  try {
    const loginResult = await createLoggedInUser(baseUrl, 'test-device-plaza-feed', '广场高亮测试用户');
    const authUser = loginResult.user;

    const [postResult] = await pool.query(
      `
        INSERT INTO plaza_posts (post_type, title, meta_text, description, reward_points, tags_json, icon, icon_class, status)
        VALUES ('help', '测试高亮需求', '测试元信息', '测试描述', 2, JSON_ARRAY('测试'), '/assets/icons/happy.svg', 'plaza-post-icon-green', 'open')
      `
    );

    const postId = Number(postResult.insertId);
    const expectedClaimCode = `TEST${Date.now()}`;

    await pool.query(
      `
        INSERT INTO plaza_claims (user_id, post_id, claim_code, status)
        VALUES (?, ?, ?, 'claimed')
      `,
      [authUser.id, postId, expectedClaimCode]
    );

    const feedResult = await requestJson(baseUrl, '/api/plaza/feed', {
      headers: {
        Authorization: `Bearer ${loginResult.token}`
      }
    });

    assert.equal(feedResult.status, 200);
    assert.equal(feedResult.body.code, 0);
    assert.equal(feedResult.body.data.highlight.code, expectedClaimCode);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('POST /api/plaza/posts/:id/complete awards reward points and closes the claim', async () => {
  const { server, baseUrl } = await createServer();

  try {
    const loginResult = await createLoggedInUser(baseUrl, 'test-device-plaza-complete', '广场完成测试用户');
    const authUser = loginResult.user;

    const [postResult] = await pool.query(
      `
        INSERT INTO plaza_posts (post_type, title, meta_text, description, reward_points, tags_json, icon, icon_class, status)
        VALUES ('help', '测试完成需求', '测试元信息', '测试描述', 7, JSON_ARRAY('测试'), '/assets/icons/happy.svg', 'plaza-post-icon-green', 'open')
      `
    );

    const postId = Number(postResult.insertId);

    const claimResult = await requestJson(baseUrl, `/api/plaza/posts/${postId}/claim`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginResult.token}`
      }
    });

    assert.equal(claimResult.status, 200);

    const [[accountBefore]] = await pool.query(
      'SELECT balance FROM point_accounts WHERE user_id = ? LIMIT 1',
      [authUser.id]
    );

    const completeResult = await requestJson(baseUrl, `/api/plaza/posts/${postId}/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginResult.token}`
      }
    });

    assert.equal(completeResult.status, 200);
    assert.equal(completeResult.body.code, 0);
    assert.equal(completeResult.body.data.pointsAwarded, 7);

    const [[claimRow]] = await pool.query(
      'SELECT status FROM plaza_claims WHERE user_id = ? AND post_id = ? LIMIT 1',
      [authUser.id, postId]
    );
    const [[postRow]] = await pool.query(
      'SELECT status FROM plaza_posts WHERE id = ? LIMIT 1',
      [postId]
    );
    const [[accountAfter]] = await pool.query(
      'SELECT balance FROM point_accounts WHERE user_id = ? LIMIT 1',
      [authUser.id]
    );
    const [[pointLogRow]] = await pool.query(
      `
        SELECT change_type, points_delta, balance_after
        FROM point_logs
        WHERE user_id = ?
          AND remark = '广场互助完成：测试完成需求'
        ORDER BY id DESC
        LIMIT 1
      `,
      [authUser.id]
    );

    assert.equal(claimRow.status, 'completed');
    assert.equal(postRow.status, 'closed');
    assert.equal(Number(accountAfter.balance), Number(accountBefore.balance) + 7);
    assert.equal(pointLogRow.change_type, 'earn');
    assert.equal(Number(pointLogRow.points_delta), 7);
    assert.equal(Number(pointLogRow.balance_after), Number(accountAfter.balance));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
