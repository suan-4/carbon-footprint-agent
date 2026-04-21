const express = require('express');
const productController = require('../controllers/productController');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

router.get('/', productController.getProducts);
router.post('/:id/redeem', requireAuth, productController.redeemProduct);

module.exports = router;
