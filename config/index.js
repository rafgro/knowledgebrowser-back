
// still dev
//process.env.NODE_ENV = 'localdev';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// to handle more db connections
require('events').EventEmitter.prototype._maxListeners = 100;

const conf = {
  //port: process.env.PORT || 3000,
  port: 3000,

  databaseURL: "aa1f3ajh2rexsb4c.ca68v3nuzco0.us-east-2.rds.amazonaws.com",

  api: {
    prefix: '/api',
  }
};

exports.conf = conf;