const express = require('express');
const loaders = require('./loaders');
const config = require('./config');

// const managerIcing = require('./jobmanagers/manager-icing'); // DELETE IN PRODUCTION

async function startServer() {
  const server = express();

  await loaders.loaderInit(server);

  server.listen(config.conf.port, (err) => {
    if (err) {
      logger.error(err.toString());
    }
    logger.info(`Server is ready at port ${config.conf.port}`);
    // managerIcing.start(); // DELETE IN PRODUCTION
  });
}

startServer();
