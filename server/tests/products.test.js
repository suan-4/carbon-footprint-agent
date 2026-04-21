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

test('GET /api/products includes badge category products', async () => {
  const { server, baseUrl } = await createServer();

  try {
    const result = await requestJson(baseUrl, '/api/products');

    assert.equal(result.status, 200);
    assert.equal(result.body.code, 0);

    const badgeProduct = result.body.data.find((item) => item.category === 'badge');
    assert.ok(badgeProduct);
    assert.equal(badgeProduct.name, 'Low Carbon Badge');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('POST /api/products/:id/redeem allows redeeming badge products', async () => {
  const { server, baseUrl } = await createServer();

  try {
    const loginResult = await createLoggedInUser(baseUrl, 'test-device-product-badge', '徽章兑换测试用户');
    const authUser = loginResult.user;

    await pool.query(
      'UPDATE point_accounts SET balance = 500 WHERE user_id = ?',
      [authUser.id]
    );
    await pool.query(
      'UPDATE users SET total_points = 500 WHERE id = ?',
      [authUser.id]
    );

    const [[badgeProduct]] = await pool.query(
      `
        SELECT id, points_cost
        FROM products
        WHERE category = 'badge'
          AND status = 1
        ORDER BY id ASC
        LIMIT 1
      `
    );

    assert.ok(badgeProduct);

    const redeemResult = await requestJson(baseUrl, `/api/products/${badgeProduct.id}/redeem`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${loginResult.token}`
      }
    });

    assert.equal(redeemResult.status, 200);
    assert.equal(redeemResult.body.code, 0);
    assert.equal(redeemResult.body.data.order.category, 'badge');

    const [[orderRow]] = await pool.query(
      'SELECT status FROM orders WHERE user_id = ? AND product_id = ? ORDER BY id DESC LIMIT 1',
      [authUser.id, badgeProduct.id]
    );
    const [[accountRow]] = await pool.query(
      'SELECT balance FROM point_accounts WHERE user_id = ? LIMIT 1',
      [authUser.id]
    );

    assert.equal(orderRow.status, 'issued');
    assert.equal(Number(accountRow.balance), 500 - Number(badgeProduct.points_cost));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
