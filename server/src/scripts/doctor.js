const env = require('../config/env');
const pool = require('../db/pool');
const appDataService = require('../services/appDataService');

async function checkMysql() {
  try {
    await pool.query('SELECT 1');
    return {
      ok: true,
      message: 'connection ok'
    };
  } catch (error) {
    return {
      ok: false,
      message: error.message
    };
  }
}

async function main() {
  const mysql = await checkMysql();
  const runtimeMysql = await appDataService.isDbAvailable();

  console.log('=== carbon-footprint-server doctor ===');
  console.log(`PORT: ${env.port}`);
  console.log(`OPENAI_BASE_URL: ${env.openai.baseUrl}`);
  console.log(`OPENAI_MODEL: ${env.openai.model}`);
  console.log(`OPENAI_API_KEY: ${env.openai.apiKey ? 'configured' : 'missing'}`);
  console.log(`MYSQL: ${env.mysql.host}:${env.mysql.port}/${env.mysql.database}`);
  console.log(`MYSQL_USER: ${env.mysql.user}`);
  console.log(`MYSQL_CONNECTION: ${mysql.ok ? 'ok' : 'failed'}`);
  console.log(`MYSQL_MESSAGE: ${mysql.message}`);
  console.log(`RUNTIME_DATA_SOURCE: ${runtimeMysql ? 'mysql' : 'mock'}`);

  await pool.end();
}

main().catch(async (error) => {
  console.error('DOCTOR_FAILED:', error.message);

  try {
    await pool.end();
  } catch (closeError) {
    console.error('POOL_CLOSE_FAILED:', closeError.message);
  }

  process.exit(1);
});
