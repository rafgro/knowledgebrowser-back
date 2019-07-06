const { Router } = require('express');
const generalExpress = require('express');
const loader = require('./loaders');
const managerCrawling = require('./jobmanagers/manager-crawling');
const managerIndexing = require('./jobmanagers/manager-indexing');
const managerCorrecting = require('./jobmanagers/manager-correcting');
const managerIcing = require('./jobmanagers/manager-icing');
const apiSearch = require('./api/search');
const apiStatsPublic = require('./api/stats/public');
const apiStatsTerms = require('./api/stats/public/terms');
const apiStatsInternal = require('./api/stats/internal');
const apiAccountsCreateuser = require('./api/accounts/createuser');
const apiAccountsLoginuser = require('./api/accounts/loginuser');

const server = Router();

/* operations */
server.get('/ops/discover', (request, response) => {
  response.send('Started job');
  managerCrawling.start();
});
server.get('/ops/index', (request, response) => {
  response.send('Started job');
  managerIndexing.start();
});
server.get('/ops/correct', (request, response) => {
  response.send('Started job');
  managerCorrecting.start();
});
server.get('/ops/ice', (request, response) => {
  response.send('Started job');
  managerIcing.start(request.query.force || 0);
});

/* api */
server.get('/api/search', (request, response) => {
  const hrstart = process.hrtime();
  apiSearch
    .doYourJob(
      loader.database,
      request.query.q,
      10,
      request.query.offset || 0,
      request.query.stats || 1,
      request.query.sort || 0,
    )
    .then((results) => {
      const hrend = process.hrtime(hrstart);
      logger.info(
        `Responded to ${request.query.q} with offset ${request.query.offset || 0} and sort ${request.query.sort || 0}`,
      );
      response.send({
        message: +hrend[1] / 1000000,
        numberofall: results.numberofall,
        results: results.results,
      });
    })
    .catch((e) => {
      logger.error(JSON.stringify(e));
      logger.error(`request: ${JSON.stringify(request.query)}`);
      response.send(e);
    });
});
server.get('/api/stats', (request, response) => {
  apiStatsPublic
    .doYourJob(loader.database)
    .then((results) => {
      response.send(results);
    })
    .catch((e) => {
      logger.error(JSON.stringify(e));
      response.send([{ text: JSON.stringify(e) }]);
    });
});
server.get('/api/stats2', (request, response) => {
  apiStatsInternal
    .doYourJob(loader.database)
    .then((results) => {
      response.send(results);
    })
    .catch((e) => {
      logger.error(JSON.stringify(e));
      response.send([{ text: JSON.stringify(e) }]);
    });
});
server.get('/api/terms', (request, response) => {
  apiStatsTerms
    .doYourJob(loader.database, request.query.today, request.query.type)
    .then((results) => {
      response.send(results);
    })
    .catch((e) => {
      logger.error(JSON.stringify(e));
      response.send([{ text: JSON.stringify(e) }]);
    });
});
server.use(generalExpress.urlencoded());
server.post('/api/accounts/createuser', (request, response) => {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsCreateuser
      .doYourJob(loader.database, request.body.email, request.body.pass)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(JSON.stringify(e));
        response.status(403);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
});
server.post('/api/accounts/loginuser', (request, response) => {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsLoginuser
      .doYourJob(loader.database, request.body.email, request.body.pass)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(JSON.stringify(e));
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
});

// Http errors
server.use((request, response) => {
  response.type('text/plain');
  response.status(404);
  response.send('Error');
});

exports.routesServer = server;
