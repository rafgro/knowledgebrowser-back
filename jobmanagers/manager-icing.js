/* eslint-disable max-len */
const loader = require('../loaders');

const icingTerms = require('../services/icing/terms');
const sumUpTerms = require('../services/icing/sum-up-terms');

exports.start = function () {
  logger.info('Start of icing work');
  const date = new Date(Date.now());
  const today = date.getUTCFullYear()
    + (date.getUTCMonth() + 1 < 10 ? '-0' : '-')
    + (date.getUTCMonth() + 1)
    + (date.getUTCDate() < 10 ? '-0' : '-')
    + date.getUTCDate();

  // TODO: if there is nothing for today date, create new row with offset to -1
  loader.database
    .select('boundary')
    .from('icing_stats')
    .where('date', '=', today)
    .and('type', '=', 'a')
    .run()
    .then((boundaryRes) => {
      // eslint-disable-next-line eqeqeq
      if (Object.keys(boundaryRes).length != 0) {
        // normal take
        loader.database
          .select('value')
          .from('manager')
          .where('option', '=', 'icing_terms_offset')
          .run()
          .then((result) => {
            if (parseInt(result[0].value, 10) === -1) {
              const dateMinusSeven = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              const textMinusSeven = dateMinusSeven.getUTCFullYear()
          + (dateMinusSeven.getUTCMonth() + 1 < 10 ? '-0' : '-')
          + (dateMinusSeven.getUTCMonth() + 1)
          + (dateMinusSeven.getUTCDate() < 10 ? '-0' : '-')
          + dateMinusSeven.getUTCDate()
          + ' 00:00:00';
              loader.database
                .select('id')
                .from('content_preprints')
                .where('date', '>=', textMinusSeven)
                .orderBy('id', 'asc')
                .limit(1)
                .run()
                .then((res) => {
                  let bound = parseInt(res[0].id, 10);
                  if (bound < 15000) bound = 15000;
                  logger.database.update('icing_stats').set('boundary', bound)
                    .where('date', '=', today).and('type', '=', 'a')
                    .run()
                    .then(() => logger.info('Good, bound to' + bound))
                    .catch(e => logger.error(e.toString()));

                  logger.database.update('manager').set('value', 0)
                    .where('option', '=', 'icing_terms_offset')
                    .run()
                    .then(() => logger.info('Good, icing offset to 0'))
                    .catch(e => logger.error(e.toString()));
                })
                .catch(e => logger.error(e.toString()));
            } else {
              loader.database
                .select('term', 'relevant', 'relevant_abstract')
                .from('index_title')
                .orderBy('term')
                .limit(50000, result[0].value) // takes 15-30 seconds
                .run()
                .then((results) => {
                  if (results.length !== 0) {
                    icingTerms.process(loader.database, results, parseInt(boundaryRes[0].boundary, 10));
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

                    if (results.length !== 50000) {
                      // we reached the end of terms
                      // now it's time to process it
                      // logger.info('THE END of icing');

                      loader.database
                        .select('rawterms')
                        .from('icing_stats')
                        .where('date', '=', today)
                        .and('type', '=', 'a')
                        .run()
                        .then((res) => {
                          sumUpTerms.endThis(res, today);
                        })
                        .catch((e) => {
                          logger.error(e.toString());
                        });
                    }
                  }
                })
                .catch((e) => {
                  logger.error(JSON.stringify(e));
                });
            }
          })
          .catch((e) => {
            logger.error(JSON.stringify(e));
          });
      } else {
        // first try this day
        loader.database.insert({ type: 'a', date: today }).into('icing_stats').run()
          .then(() => logger.info('Good, created first icing stats row for this day'))
          .catch(e => logger.error(e.toString()));
        loader.database.update('manager').set('value', -1).where('option', '=', 'icing_terms_offset').run()
          .then(() => logger.info('Good, set icing offset to -1'))
          .catch(e => logger.error(e.toString()));
      }
    })
    .catch(e => logger.error(e.toString()));
};
