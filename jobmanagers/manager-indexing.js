const loader = require('../loaders');

const indexPreprintTitle = require('../services/indexing/preprintTitle');
const indexPreprintAbstract = require('../services/indexing/preprintAbstract');

exports.start = function () {
  logger.info('------------------INDEXING START------------------');
  loader.database
    .select('value')
    .from('manager')
    .where('option', '=', 'indexing_offset')
    .run()
    .then((result) => {
      loader.database
        .select('id')
        .from('content_preprints')
        .orderBy('id')
        .limit(50, result[0].value)
        .run()
        .then((onepubresult) => {
          let counterForPubs = 0;
          onepubresult.forEach((element, index, array) => {
            setTimeout(() => {
              // console.log(element.id);
              counterForPubs += 1;
              logger.info('Working with pub number ' + counterForPubs);
              let doStop = false;
              if (counterForPubs === array.length) {
                doStop = true;
              }
              // console.log(doStop);
              indexPreprintTitle.index(element.id, doStop);
            }, 1000 * index);
          });

          if (onepubresult.length !== 0) {
            const value = parseInt(result[0].value, 10) + onepubresult.length; // +1;
            loader.database
              .update('manager')
              .set('value', value.toString())
              .where('option', '=', 'indexing_offset')
              .run()
              .then(() => {
                logger.info('Offset set to ' + value);
              })
              .catch((e) => {
                logger.error(e);
              })
              .finally(() => {
                // logger.info('Stopping manager 1');
                // sh.stop();
              });
          } else {
            // logger.info('Stopping manager 2');
            // sh.stop();
          }
        })
        .catch((e) => {
          logger.error(e);
        });
    })
    .catch((e) => {
      logger.error(e);
    });

  loader.database
    .select('value')
    .from('manager')
    .where('option', '=', 'indexing_offset_abstract')
    .run()
    .then((result) => {
      loader.database
        .select('id')
        .from('content_preprints')
        .orderBy('id')
        .limit(50, result[0].value)
        .run()
        .then((onepubresult) => {
          let counterForPubs = 0;
          onepubresult.forEach((element, index, array) => {
            setTimeout(() => {
              // console.log(element.id);
              counterForPubs += 1;
              logger.info('Working with pub number ' + counterForPubs);
              let doStop = false;
              if (counterForPubs === array.length) {
                doStop = true;
              }
              // console.log(doStop);
              indexPreprintAbstract.index(element.id, doStop);
            }, 1000 * index);
          });

          if (onepubresult.length !== 0) {
            const value = parseInt(result[0].value, 10) + onepubresult.length; // +1;
            loader.database
              .update('manager')
              .set('value', value.toString())
              .where('option', '=', 'indexing_offset_abstract')
              .run()
              .then(() => {
                logger.info('Offset set to ' + value);
              })
              .catch((e) => {
                logger.error(e);
              })
              .finally(() => {
                // logger.info('Stopping manager 1');
                // sh.stop();
              });
          } else {
            // logger.info('Stopping manager 2');
            // sh.stop();
          }
        })
        .catch((e) => {
          logger.error(e);
        });
    })
    .catch((e) => {
      logger.error(e);
    });
};
