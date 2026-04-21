const authService = require('../services/authService');

exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body || {});

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.getSession = async (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      loggedIn: Boolean(req.authUser),
      user: req.authUser || null
    }
  });
};

exports.logout = async (req, res, next) => {
  try {
    await authService.logout(req.authToken);

    res.json({
      code: 0,
      message: 'success',
      data: true
    });
  } catch (error) {
    next(error);
  }
};
