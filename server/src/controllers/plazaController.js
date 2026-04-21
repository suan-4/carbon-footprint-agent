const plazaService = require('../services/plazaService');

exports.getPlazaFeed = async (req, res, next) => {
  try {
    const result = await plazaService.getPlazaFeed(req.query.filter, req.authUser);

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.claimPlazaPost = async (req, res, next) => {
  try {
    const postId = Number(req.params.id);
    const result = await plazaService.claimPlazaPost(postId, req.authUser);

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.completePlazaPost = async (req, res, next) => {
  try {
    const postId = Number(req.params.id);
    const result = await plazaService.completePlazaPost(postId, req.authUser);

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
