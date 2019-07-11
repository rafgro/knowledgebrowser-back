const { Router } = require('express');
const generalExpress = require('express');
const loader = require('./loaders');
const managerCrawling = require('./jobmanagers/manager-crawling');
const managerIndexing = require('./jobmanagers/manager-indexing');
const managerCorrecting = require('./jobmanagers/manager-correcting');
const managerIcing = require('./jobmanagers/manager-icing');
const managerNotifying = require('./jobmanagers/manager-notifying');
const apiSearch = require('./api/search');
const apiStatsPublic = require('./api/stats/public');
const apiStatsTerms = require('./api/stats/public/terms');
const apiStatsInternal = require('./api/stats/internal');
const apiAccountsCreateuser = require('./api/accounts/createuser');
const apiAccountsLoginuser = require('./api/accounts/loginuser');
const apiAccountsUserdataNotifications = require('./api/accounts/userdata-notifications');
const apiAccountsNotificationAdd = require('./api/accounts/notification-add');
const apiAccountsNotificationUpdate = require('./api/accounts/notification-update');
const apiAccountsNotificationDelete = require('./api/accounts/notification-delete');
const apiAccountsConfirmUser = require('./api/accounts/confirmuser');
const apiAccountsChangeUser = require('./api/accounts/changeuser');
const apiAccountUserdataMailstatus = require('./api/accounts/userdata-mailstatus');
const apiAccountsForgottenPass1 = require('./api/accounts/forgottenpass1');
const apiAccountsForgottenPass2 = require('./api/accounts/forgottenpass2');

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
server.get('/ops/notify', (request, response) => {
  response.send('Started job');
  managerNotifying.start();
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
        `Responded to ${request.query.q} with offset ${request.query.offset || 0} and sort ${request.query.sort || 0} in <strong>${hrend[1] / 1000000} ms</strong>`,
      );
      response.send({
        message: +hrend[1] / 1000000,
        numberofall: results.numberofall,
        results: results.results,
      });
    })
    .catch((e) => {
      logger.error(e);
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
      logger.error(e);
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
      logger.error(e);
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
      logger.error(e);
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
        logger.error(e);
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
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
});
server.post('/api/accounts/allnotifications', (request, response) => {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsUserdataNotifications
      .doYourJob(loader.database, request.body.email)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
});
server.post('/api/accounts/addonenotification', (request, response) => {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsNotificationAdd
      .doYourJob(loader.database, request.body.account, request.body.keywords,
        request.body.relevance, request.body.frequency, request.body.where)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
});
server.post('/api/accounts/updatenotification', (request, response) => {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsNotificationUpdate
      .doYourJob(loader.database, request.body.account, request.body.keywords,
        request.body.relevance, request.body.frequency, request.body.where,
        request.body.hiddenid)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
});
server.post('/api/accounts/deletenotification', (request, response) => {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsNotificationDelete
      .doYourJob(loader.database, request.body.account, request.body.hiddenid)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
});
server.post('/api/accounts/confirmuser', (request, response) => {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsConfirmUser
      .doYourJob(loader.database, request.body.key)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
});
server.post('/api/accounts/usermailstatus', (request, response) => {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountUserdataMailstatus
      .doYourJob(loader.database, request.body.email)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
});
server.post('/api/accounts/changeusermail', (request, response) => {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsChangeUser
      .doChangeUserMail(loader.database, request.body.oldmail,
        request.body.pass, request.body.newmail)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
});
server.post('/api/accounts/changeuserpass', (request, response) => {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsChangeUser
      .doChangeUserPass(loader.database, request.body.mail,
        request.body.oldpass, request.body.newpass)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
});
server.post('/api/accounts/forgottenpass1', (request, response) => {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsForgottenPass1
      .doYourJob(loader.database, request.body.mail)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
        response.status(401);
        response.send(e);
      });
  } else {
    response.status(401);
    response.send({ errorType: 'key', message: 'Sorry, we\'ve encountered an error' });
  }
});
server.post('/api/accounts/forgottenpass2', (request, response) => {
  if (request.body.hey === 'ZXVUXb96JPgZVspA') {
    apiAccountsForgottenPass2
      .doYourJob(loader.database, request.body.key, request.body.pass)
      .then((results) => {
        response.status(200);
        response.send(results);
      })
      .catch((e) => {
        logger.error(e);
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
