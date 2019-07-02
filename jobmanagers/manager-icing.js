const loader = require('../loaders');

const icingTerms = require('../services/icing/terms');

exports.start = function () {
  logger.info('Start of icing work');
  loader.database
    .select('value')
    .from('manager')
    .where('option', '=', 'icing_terms_offset')
    .run()
    .then((result) => {
      loader.database
        .select('term', 'relevant', 'relevant_abstract')
        .from('index_title')
        .orderBy('term')
        .limit(50000, result[0].value) // ten thousand takes around 30 seconds
        .run()
        .then((results) => {
          icingTerms.process(loader.database, results);

          if (results.length !== 0) {
            const value = parseInt(result[0].value, 10) + results.length;
            loader.database
              .update('manager')
              .set('value', value.toString())
              .where('option', '=', 'icing_terms_offset')
              .run()
              .then(() => {
                logger.info('Icing offset set to ' + value);
              })
              .catch((e) => {
                logger.error(JSON.stringify(e));
              });

            if (results.length !== 10000) {
              // we reached the end of terms
              // now it's time to process it
              // TODO
              logger.info('THE END of icing');
            }
          }
        })
        .catch((e) => {
          logger.error(JSON.stringify(e));
        });
    })
    .catch((e) => {
      logger.error(JSON.stringify(e));
    });
};
