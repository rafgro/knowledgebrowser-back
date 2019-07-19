const loader = require('../loaders');
const apiSearch = require('../api/search');

exports.respond = function (request, response) {
  const hrstart = process.hrtime();
  apiSearch
    .doYourJob(
      loader.database,
      request.query.q,
      10,
      request.query.offset || 0,
      request.query.stats || 1,
      request.query.sort || 0,
      request.query.minrel || 4,
      request.query.span || 720,
      request.query.linear || false,
    )
    .then((results) => {
      const hrend = process.hrtime(hrstart);
      logger.info(
        `Responded to ${request.query.q} with offset ${request.query.offset || 0} and sort ${request.query.sort || 0} in <strong>${hrend[1] / 1000000} ms</strong>`,
      );
      response.send({
        message: hrend[1] / 1000000,
        numberofall: results.numberofall,
        results: results.results,
      });
    })
    .catch((e) => {
      logger.error(e);
      logger.error(`request: ${JSON.stringify(request.query)}`);
      response.send(e);
    });
};
