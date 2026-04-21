const agentService = require('../services/agentService');

exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body || {};

    if (!message || !String(message).trim()) {
      res.status(400).json({
        code: 400,
        message: 'message 必填',
        data: null
      });
      return;
    }

    const result = await agentService.chat(String(message));

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
