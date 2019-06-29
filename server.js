'use strict'
const loaders = require('./loaders');
const express = require('express');
const config  = require('./config');

async function startServer() {

  const server = express();

  await loaders.loaderInit( server );

  server.listen(config.conf.port, err => {
    if (err) {
      logger.error(err.toString());
    }
    logger.info('Server is ready at port '+config.conf.port);
  });

}

startServer();