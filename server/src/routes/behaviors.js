const express = require('express');
const behaviorController = require('../controllers/behaviorController');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

router.get('/catalog', behaviorController.getBehaviorCatalog);
router.post('/', requireAuth, behaviorController.createBehaviorRecord);

module.exports = router;
