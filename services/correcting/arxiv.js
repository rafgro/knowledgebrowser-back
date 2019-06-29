const loader = require('../../loaders');

exports.process = function (preprints) {
  // just go through each title and if necessary - rollback date to 2019-04-01
  // (later will update to real)

  const arrayOfQueries = [];
  preprints.forEach((element) => {
    let needToUpdate = false;
    if (element.server === 'arXiv') {
      const processedTitle = unescape(element.title);
      if (
        processedTitle.includes('v2')
        || processedTitle.includes('v3')
        || processedTitle.includes('v4')
        || processedTitle.includes('v5')
        || processedTitle.includes('v6')
      ) {
        needToUpdate = true;
      }
    }

    if (needToUpdate) {
      arrayOfQueries.push(
        loader.database
          .update('content_preprints')
          .set('date', '2019-04-01 00:00:00')
          .where('id', '=', element.id)
          .run(),
      );
    }
  });

  if (arrayOfQueries.length === 0) logger.info('good: nothing to correct');
  else {
    Promise.all(arrayOfQueries)
      .then(() => {
        logger.info(`good: updated ${arrayOfQueries.length} arxiv preprints`);
      })
      .catch((e) => {
        logger.error(e.toString());
      });
  }
};
