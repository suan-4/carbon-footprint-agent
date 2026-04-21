module.exports = (error, req, res, next) => {
  console.error(error);

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    code: statusCode,
    message: error.message || '服务器内部错误',
    data: null
  });
};
