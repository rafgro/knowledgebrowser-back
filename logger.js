const winston = require('winston');
var stackify = require('stackify-logger');
stackify.start({apiKey: '9Mn3Lp1Um1Af4Do9Zt6Pg1Xo5Qg7Ir4Xe8Lv6Rb'});
require('winston-stackify').Stackify;
global.logger = winston.createLogger({
  transports: [
    new (winston.transports.Stackify)({storage : stackify})
    //, new winston.transports.Console()
  ]
});