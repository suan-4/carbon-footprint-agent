module.exports = (req, res, next) => {
  if (req.authUser) {
    next();
    return;
  }

  res.status(401).json({
    code: 401,
    message: '请先登录',
    data: null
  });
};
