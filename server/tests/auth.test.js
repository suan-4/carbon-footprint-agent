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

after(async () => {
  await pool.end();
});

test('POST /api/auth/login returns a token and current user', async () => {
  const { server, baseUrl } = await createServer();

  try {
    const result = await requestJson(baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: 'test-device-auth-login',
        profile: {
          nickname: '测试登录用户'
        }
      })
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.code, 0);
    assert.ok(result.body.data.token);
    assert.ok(result.body.data.user);
    assert.equal(result.body.data.user.nickname, '测试登录用户');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('GET /api/auth/session returns the logged-in user from bearer token', async () => {
  const { server, baseUrl } = await createServer();

  try {
    const loginResult = await requestJson(baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: 'test-device-auth-session',
        profile: {
          nickname: '测试会话用户'
        }
      })
    });

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.body.data.token);

    const token = loginResult.body.data.token;
    const sessionResult = await requestJson(baseUrl, '/api/auth/session', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    assert.equal(sessionResult.status, 200);
    assert.equal(sessionResult.body.code, 0);
    assert.equal(sessionResult.body.data.loggedIn, true);
    assert.equal(sessionResult.body.data.user.nickname, '测试会话用户');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('GET /api/users/me returns 401 when no bearer token is provided', async () => {
  const { server, baseUrl } = await createServer();

  try {
    const result = await requestJson(baseUrl, '/api/users/me');

    assert.equal(result.status, 401);
    assert.equal(result.body.code, 401);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
