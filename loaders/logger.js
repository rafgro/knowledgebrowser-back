const {
  // eslint-disable-next-line no-unused-vars
  winston,
  format,
  createLogger,
  transports,
} = require('winston');

const logger = createLogger({
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

global.logger = logger;
