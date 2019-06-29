const loggerLoader = require('./logger');
const expressLoader = require('./express');
const postgresLoader = require('./postgres');

var postgresConnection;

async function init( expressApp ) {
    postgresConnection = postgresLoader.postgresInit();
    logger.info('Postgres intialized');
    exports.database = postgresConnection;

    await expressLoader.expressInit( expressApp );
    logger.info('Express intialized');
}

exports.loaderInit = init;