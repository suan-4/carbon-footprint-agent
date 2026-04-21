const express = require('express');
const userController = require('../controllers/userController');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

router.use(requireAuth);
router.get('/me', userController.getCurrentUser);
router.get('/me/points', userController.getPointAccount);
router.get('/me/redemptions', userController.getRedemptionOrders);

module.exports = router;
