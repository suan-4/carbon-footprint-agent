const authService = require('../services/authService');

module.exports = async (req, res, next) => {
  try {
    const authorization = String(req.headers.authorization || '');
    const matched = authorization.match(/^Bearer\s+(.+)$/i);
    const sessionToken = matched ? matched[1].trim() : '';

    req.authToken = sessionToken;
    req.authUser = sessionToken ? await authService.getSessionUser(sessionToken) : null;

    next();
  } catch (error) {
    next(error);
  }
};
