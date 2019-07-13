/* eslint-disable no-console */

const {
  // eslint-disable-next-line no-unused-vars
  winston,
  format,
  createLogger,
  transports,
} = require('winston');

const winstonLogger = createLogger({
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.simple(),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'winston-error.log', level: 'error' }),
    new transports.File({ filename: 'winston-combined.log' }),
  ],
});

// global.logger = logger;
global.logger = {
  info(what) {
    if (process.env.NODE_ENV === 'development') {
      console.log(what);
    } else {
      const variant1 = JSON.stringify(what);
      const variant2 = what.toString();
      if (variant1 !== '{}') {
        winstonLogger.info(variant1);
      } else if (variant2 !== '{}' && variant2 !== '[object Object]') {
        winstonLogger.info(variant2);
      } else {
        winstonLogger.info(what);
      }
    }
  },

  error(what) {
    if (process.env.NODE_ENV === 'development') {
      console.log(what);
    } else {
      const variant1 = JSON.stringify(what);
      const variant2 = what.toString();
      if (variant1 !== '{}') {
        winstonLogger.error(variant1);
      } else if (variant2 !== '{}' && variant2 !== '[object Object]') {
        winstonLogger.error(variant2);
      } else {
        winstonLogger.error(what);
      }
    }
  },
};
