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
    if (typeof what === 'object') winstonLogger.info(JSON.stringify(what));
    else winstonLogger.info(what);
  },
  error(what) {
    if (typeof what === 'object') winstonLogger.error(JSON.stringify(what));
    else winstonLogger.error(what);
  },
};
