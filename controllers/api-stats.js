const loader = require('../loaders');
const apiStatsPublic = require('../api/stats/public');
const apiStatsTerms = require('../api/stats/public/terms');
const apiStatsInternal = require('../api/stats/internal');

exports.respondToPublic = function (request, response) {
  apiStatsPublic
    .doYourJob(loader.database)
    .then((results) => {
      response.send(results);
    })
    .catch((e) => {
      logger.error(e);
      response.send([{ text: JSON.stringify(e) }]);
    });
};

exports.respondToInternal = function (request, response) {
  apiStatsInternal
    .doYourJob(loader.database)
    .then((results) => {
      response.send(results);
    })
    .catch((e) => {
      logger.error(e);
      response.send([{ text: JSON.stringify(e) }]);
    });
};

exports.respondToTerms = function (request, response) {
  apiStatsTerms
    .doYourJob(loader.database, request.query.today, request.query.type)
    .then((results) => {
      response.send(results);
    })
    .catch((e) => {
      logger.error(e);
      response.send([{ text: JSON.stringify(e) }]);
    });
};
