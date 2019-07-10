const express = require('express');
const loaders = require('./loaders');
const config = require('./config');

async function startServer() {
  const server = express();

  await loaders.loaderInit(server);

  server.listen(config.conf.port, (err) => {
    if (err) {
      logger.error(err);
    }
    logger.info(`Server is ready at port ${config.conf.port}`);
  });
}

startServer();
