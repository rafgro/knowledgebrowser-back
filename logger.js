const { winston, format, createLogger, transports } = require('winston');

const env = process.env.NODE_ENV || 'awsone';

const logger = createLogger({

    format: format.simple(),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'winston-error.log', level: 'error' }),
        new transports.File({ filename: 'winston-combined.log'  })
    ]
});

global.logger = logger;