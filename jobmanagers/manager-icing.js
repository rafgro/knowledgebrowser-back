/* eslint-disable max-len */
const loader = require('../loaders');

const icingTerms = require('../services/icing/terms');
const sumUpTerms = require('../services/icing/sum-up-terms');

exports.start = function (ifForce) {
  logger.info('Start of icing work');

  const date = new Date(Date.now());
  const today = date.getUTCFullYear()
    + (date.getUTCMonth() + 1 < 10 ? '-0' : '-')
    + (date.getUTCMonth() + 1)
    + (date.getUTCDate() < 10 ? '-0' : '-')
    + date.getUTCDate();

  // eslint-disable-next-line eqeqeq
  if (ifForce == 1) {
    loader.database
      .select('rawterms')
      .from('icing_stats')
      .where('date', '=', today)
      .and('type', '=', 'a')
      .run()
      .then((res) => {
        sumUpTerms.endThis(loader.database, res, today, 'a');
      })
      .catch((e) => {
        logger.error(e);
      });
  } else {
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
                + dateMinusSeven.getUTCDate();
                loader.database
                  .select('id')
                  .from('content_preprints')
                  .where('date', '>=', textMinusSeven + ' 01:00:00')
                  .and('date', '<=', textMinusSeven + ' 23:59:00')
                  .orderBy('id', 'asc')
                  .limit(1)
                  .run()
                  .then((res) => {
                    let bound = parseInt(res[0].id, 10);
                    if (bound < 30000 || Number.isNaN(bound)) {
                      loader.database.select('boundary').from('icing_stats').orderBy('id', 'desc').limit(2)
                        .run()
                        .then((res2) => {
                          bound = parseInt(res2[1].boundary, 10) + 50;
                          loader.database.update('icing_stats').set('boundary', bound)
                            .where('date', '=', today).and('type', '=', 'a')
                            .run()
                            .then(() => logger.info('Good, bound to ' + bound))
                            .catch(e => logger.error(e));

                          loader.database.update('manager').set('value', 0)
                            .where('option', '=', 'icing_terms_offset')
                            .run()
                            .then(() => logger.info('Good, icing offset to 0'))
                            .catch(e => logger.error(e));
                        })
                        .catch(e => logger.error(e));
                    } else {
                      loader.database.update('icing_stats').set('boundary', bound)
                        .where('date', '=', today).and('type', '=', 'a')
                        .run()
                        .then(() => logger.info('Good, bound to ' + bound))
                        .catch(e => logger.error(e));

                      loader.database.update('manager').set('value', 0)
                        .where('option', '=', 'icing_terms_offset')
                        .run()
                        .then(() => logger.info('Good, icing offset to 0'))
                        .catch(e => logger.error(e));
                    }
                  })
                  .catch(e => logger.error(e));
              } else if (parseInt(result[0].value, 10) % 100000 === 0) {
                loader.database
                  .select('term', 'relevant', 'relevant_abstract')
                  .from('index_title')
                  .orderBy('term')
                  .limit(100000, result[0].value) // takes 15-30 seconds
                  .run()
                  .then((results) => {
                    if (results.length !== 0) {
                      icingTerms.process(loader.database, results, parseInt(boundaryRes[0].boundary, 10));
                      const value = parseInt(result[0].value, 10) + results.length;
                      loader.database
                        .update('manager')
                        .set('value', value)
                        .where('option', '=', 'icing_terms_offset')
                        .run()
                        .then(() => {
                          logger.info('Icing offset set to ' + value);
                        })
                        .catch((e) => {
                          logger.error(e);
                        });

                      if (results.length !== 100000) {
                      // we reached the end of terms
                      // now it's time to process it
                        logger.info('THE END of icing');

                        loader.database
                          .select('rawterms')
                          .from('icing_stats')
                          .where('date', '=', today)
                          .and('type', '=', 'a')
                          .run()
                          .then((res) => {
                            sumUpTerms.endThis(loader.database, res, today, 'a');
                          })
                          .catch((e) => {
                            logger.error(e);
                          });
                      }
                    }
                  })
                  .catch((e) => {
                    logger.error(e);
                  });
              }
            })
            .catch((e) => {
              logger.error(e);
            });
        } else {
        // first try this day
          loader.database.insert({ type: 'a', date: today }).into('icing_stats').run()
            .then(() => logger.info('Good, created first icing stats row for this day'))
            .catch(e => logger.error(e));
          loader.database.update('manager').set('value', -1).where('option', '=', 'icing_terms_offset').run()
            .then(() => logger.info('Good, set icing offset to -1'))
            .catch(e => logger.error(e));
        }
      })
      .catch(e => logger.error(e));
  }
};
