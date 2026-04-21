const appDataService = require('../services/appDataService');

exports.getProducts = async (req, res, next) => {
  try {
    const products = await appDataService.getProducts();

    res.json({
      code: 0,
      message: 'success',
      data: products
    });
  } catch (error) {
    next(error);
  }
};

exports.redeemProduct = async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const result = await appDataService.redeemProduct(productId, req.authUser);

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
