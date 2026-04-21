module.exports = (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  });
};

