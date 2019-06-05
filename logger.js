const { winston, createLogger, transports } = require('winston');

const env = process.env.NODE_ENV || 'awsone';

const logger = createLogger({

    transports: [
        new transports.Console()
    ]
});

global.logger = logger;