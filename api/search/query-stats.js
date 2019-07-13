exports.register = function (sh, query, lastQuality, newDetails, lastExecTime) {
  sh.insert({
    query: '$query',
    lastquality: '$lastQuality',
    details: "\'[" + newDetails + "]\'",
    lastexectime: '$lastExecTime',
  })
    .into('query_stats')
    .run({ query, lastQuality, lastExecTime })
    .then(() => {
      logger.info(`Logged query ${query}`);
    })
    .catch((e) => {
      logger.error(e);
    });
};
