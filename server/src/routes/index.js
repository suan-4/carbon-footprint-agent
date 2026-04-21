const express = require('express');
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const behaviorRoutes = require('./behaviors');
const productRoutes = require('./products');
const reportRoutes = require('./reports');
const agentRoutes = require('./agent');
const plazaRoutes = require('./plaza');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/behaviors', behaviorRoutes);
router.use('/products', productRoutes);
router.use('/reports', reportRoutes);
router.use('/agent', agentRoutes);
router.use('/plaza', plazaRoutes);

module.exports = router;
