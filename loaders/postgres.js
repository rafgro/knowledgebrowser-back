const { shiphold } = require('ship-hold');
// const config = require('../config');

function doJob() {
  if (process.env.NODE_ENV === 'development') {
    logger.info('Local');
    return shiphold({
      host: 'localhost',
      user: 'crawler',
      password: 'blackseo666',
      database: 'preprint-crawls',
    });
  }

  return shiphold({
    host: 'aa1f3ajh2rexsb4c.ca68v3nuzco0.us-east-2.rds.amazonaws.com', // config.conf.api.databaseURL,
    user: 'crawler', // process.env.RDS_USERNAME,
    password: 'kjfhds576sfdfs561', // process.env.RDS_PASSWORD,
    port: 5432,
    database: 'postgres',
  });
}

exports.postgresInit = doJob;
