const express = require('express');
const plazaController = require('../controllers/plazaController');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

router.get('/feed', plazaController.getPlazaFeed);
router.post('/posts/:id/claim', requireAuth, plazaController.claimPlazaPost);
router.post('/posts/:id/complete', requireAuth, plazaController.completePlazaPost);

module.exports = router;
