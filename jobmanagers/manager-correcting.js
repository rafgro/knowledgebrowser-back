const loader = require('../loaders');

// const correctTerms = require('../services/correcting/terms');
const correctArxiv = require('../services/correcting/arxiv');

exports.start = function () {
  loader.database
    .select('value')
    .from('manager')
    .where('option', '=', 'correcting_arxiv_offset')
    .run()
    .then((result) => {
      loader.database
        .select('id', 'title', 'server')
        .from('content_preprints')
        .orderBy('id')
        .limit(1000, result[0].value)
        .run()
        .then((results) => {
          correctArxiv.process(results);

          if (results.length !== 0) {
            const value = parseInt(result[0].value, 10) + results.length; // +1;
            loader.database
              .update('manager')
              .set('value', value.toString())
              .where('option', '=', 'correcting_arxiv_offset')
              .run()
              .then(() => {
                logger.info('Correction offset set to ' + value);
              })
              .catch((e) => {
                logger.error(e.toString());
              });
          }
        })
        .catch((e) => {
          logger.error(e.toString());
        });
    })
    .catch((e) => {
      logger.error(e.toString());
    });

  /* sh.select('value').from('manager').where('option','=', 'correcting_terms_offset')
    .run()
    .then(result => {

        sh.select('term','relevant').from("index_title").orderBy('term')
        .limit(500,result[0].value).run()
        .then( results => {

            correctTerms.process(results);

            if( results.length != 0 ) {
                let value = parseInt(result[0].value) +results.length;//+1;
                sh.update('manager').set('value',value.toString())
                .where('option','=','correcting_terms_offset')
                .run()
                .then(() => {
                    logger.info('Correction offset set to '+value);
                })
                .catch(e => {
                    logger.error(e.toString());
                });
            }

        })
        .catch( e => {
            logger.error(e.toString());
        });

    })
    .catch(e => {
        logger.error(e.toString());
    }); */
};
