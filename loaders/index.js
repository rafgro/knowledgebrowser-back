// eslint-disable-next-line no-unused-vars
const loggerLoader = require('./logger');
const expressLoader = require('./express');
const postgresLoader = require('./postgres');

let postgresConnection;

async function init(expressApp) {
  postgresConnection = postgresLoader.postgresInit();
  logger.info('Postgres intialized');
  exports.database = postgresConnection;

  await expressLoader.expressInit(expressApp);
  logger.info('Express intialized');
}

exports.loaderInit = init;
