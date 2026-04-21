const appDataService = require('../services/appDataService');

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await appDataService.getCurrentUser(req.authUser);

    res.json({
      code: 0,
      message: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.getPointAccount = async (req, res, next) => {
  try {
    const pointAccount = await appDataService.getPointAccount(req.authUser);

    res.json({
      code: 0,
      message: 'success',
      data: pointAccount
    });
  } catch (error) {
    next(error);
  }
};

exports.getRedemptionOrders = async (req, res, next) => {
  try {
    const orders = await appDataService.getRedemptionOrders(req.authUser);

    res.json({
      code: 0,
      message: 'success',
      data: orders
    });
  } catch (error) {
    next(error);
  }
};
