const appDataService = require('../services/appDataService');

exports.getWeeklyOverview = async (req, res, next) => {
  try {
    const overview = await appDataService.getWeeklyOverview(req.authUser);

    res.json({
      code: 0,
      message: 'success',
      data: overview
    });
  } catch (error) {
    next(error);
  }
};
