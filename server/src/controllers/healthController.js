const env = require('../config/env');
const appDataService = require('../services/appDataService');

exports.getHealth = async (req, res, next) => {
  try {
    const dbAvailable = await appDataService.isDbAvailable();

    res.json({
      code: 0,
      message: 'ok',
      data: {
        service: 'carbon-footprint-server',
        time: new Date().toISOString(),
        runtime: {
          dataSource: dbAvailable ? 'mysql' : 'mock',
          mysqlAvailable: dbAvailable,
          openaiConfigured: Boolean(env.openai.apiKey),
          openaiModel: env.openai.model
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
