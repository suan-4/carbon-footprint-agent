const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const authContext = require('./middlewares/authContext');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    code: 0,
    message: 'carbon-footprint-server is running',
    data: {
      docs: [
        '/api/health',
        '/api/auth/login',
        '/api/auth/session',
        '/api/auth/logout',
        '/api/users/me',
        '/api/users/me/points',
        '/api/users/me/redemptions',
        '/api/behaviors/catalog',
        '/api/products',
        '/api/products/:id/redeem',
        '/api/reports/weekly-overview',
        '/api/agent/chat',
        '/api/plaza/feed',
        '/api/plaza/posts/:id/claim',
        '/api/plaza/posts/:id/complete'
      ]
    }
  });
});

app.use('/api', authContext, routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
