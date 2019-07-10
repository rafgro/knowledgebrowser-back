const loader = require('../../loaders');

exports.process = function (terms) {
  // first: download list of ids
  // then: check each relevant if contains empty, and if so, modify and update

  // console.log(terms);

  loader.database
    .select('id')
    .from('content_preprints')
    .run()
    .then((ids) => {
      const idList = ids.map(e => e.id);
      const arrayOfQueries = [];
      terms.forEach((element) => {
        let needToUpdate = false;
        const modified = [];
        JSON.parse(element.relevant).forEach((element2) => {
          if (idList.includes(parseInt(element2.p, 10)) === false) {
            needToUpdate = true;
          } else {
            modified.push(element2); // push only if the pub exists
          }
        });

        if (needToUpdate) {
          arrayOfQueries.push(
            loader.database
              .update('index_title')
              .set('relevant', `'${JSON.stringify(modified)}'`)
              .where('term', '=', element.term)
              .run(),
          );
        }
      });

      if (arrayOfQueries.length === 0) { logger.info(`good: nothing to correct in ${terms.length} terms`); } else {
        Promise.all(arrayOfQueries)
          .then(() => {
            logger.info(
              `good: updated ${arrayOfQueries.length} out of ${
                terms.length
              } terms`,
            );
          })
          .catch((e) => {
            logger.error(e);
          });
      }
    })
    .catch((e) => {
      logger.error(e);
    });
};
