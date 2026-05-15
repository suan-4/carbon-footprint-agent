const express = require('express');
const appDataService = require('../services/appDataService');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

router.get('/factors', (req, res, next) => {
  res.json({
    code: 0,
    message: 'success',
    data: appDataService.CARBON_FACTORS
  });
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { dataType, category, value, recordDate } = req.body || {};

    if (!dataType || !category || !value || !recordDate) {
      res.status(400).json({
        code: 400,
        message: 'dataType, category, value, recordDate 必填',
        data: null
      });
      return;
    }

    const result = await appDataService.submitCarbonData(
      { dataType, category, value, recordDate },
      req.authUser
    );

    res.json({
      code: 0,
      message: '录入成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { dataType, startDate, endDate, limit } = req.query;
    const entries = await appDataService.getCarbonDataEntries(
      req.authUser,
      { dataType, startDate, endDate, limit: parseInt(limit) || 50 }
    );

    res.json({
      code: 0,
      message: 'success',
      data: entries
    });
  } catch (error) {
    next(error);
  }
});

router.get('/summary', requireAuth, async (req, res, next) => {
  try {
    const summary = await appDataService.getCarbonSummary(req.authUser);

    res.json({
      code: 0,
      message: 'success',
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;