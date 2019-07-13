// eslint-disable-next-line no-unused-vars
const express = require('express');
const config = require('../config');
const routes = require('../routes');
const ctrlOps = require('../controllers/ops');
const ctrlApi = require('../controllers/api');

async function doJob(app) {
  app.set('port', config.conf.port);

  // Load routes
  app.use('/', routes.routesServer);
  app.use('/ops', ctrlOps.routes);
  app.use('/api', ctrlApi.routes);

  // Internal errors
  process.on('unhandledRejection', r => logger.error(r));

  // Return the express app
  return app;
}

exports.expressInit = doJob;
