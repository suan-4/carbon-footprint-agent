const express = require('express');
const reportController = require('../controllers/reportController');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

router.get('/weekly-overview', requireAuth, reportController.getWeeklyOverview);

module.exports = router;
