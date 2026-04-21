const appDataService = require('../services/appDataService');

exports.getBehaviorCatalog = async (req, res, next) => {
  try {
    const catalog = await appDataService.getBehaviorCatalog();

    res.json({
      code: 0,
      message: 'success',
      data: catalog
    });
  } catch (error) {
    next(error);
  }
};

exports.createBehaviorRecord = async (req, res, next) => {
  try {
    const { behaviorCode, behaviorName, description } = req.body || {};

    if (!behaviorCode && !behaviorName) {
      res.status(400).json({
        code: 400,
        message: 'behaviorCode 或 behaviorName 必填',
        data: null
      });
      return;
    }

    const result = await appDataService.submitBehavior({ behaviorCode, behaviorName, description }, req.authUser);

    res.json({
      code: 0,
      message: '记录成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
