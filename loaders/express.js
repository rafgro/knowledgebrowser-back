const express = require('express');
const routes = require('../routes');
const config = require('../config');

async function doJob ( app ) {

    app.set('port', config.conf.port);
  
    // Load API routes
    app.use('/', routes.routesServer);
  
    // Internal errors
    process.on('unhandledRejection', r => logger.error(r));
  
    // Return the express app
    return app;
}

exports.expressInit = doJob;