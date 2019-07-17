/* eslint-disable no-underscore-dangle */
const logContinuity = require('./logContinuity');

exports.processJsonBody = function (sh, body, name) {
  let fatalError = null;
  let intercepted = 0;
  let inserted = 0;
  let existed = 0;
  let errored = 0;

  if (Object.keys(body).length === 0) {
    fatalError = 'empty body';
  } else if (!Array.isArray(body._items)) {
    fatalError = 'no array in body';
  } else if (body._items[0].doi === undefined) {
    fatalError = 'unknown structure of entry';
  } else {
    intercepted = body._items.length;

    body._items.forEach((element) => {
      let nonDuplicated = false;

      sh.select('doi')
        .from('content_preprints')
        .where('doi', '=', `doi:${element.doi}`)
        .run()
        .then((doi) => {
          if (doi.length === 0) {
            nonDuplicated = true;
          } else {
            existed += 1;
          }
          if (!doi.includes('v1')) nonDuplicated = false;

          if (nonDuplicated === true) {
            const hour = new Date().getUTCHours();
            let myDate = ''; // format: 2019-06-04 08:00:00
            if (hour < 10) myDate = `${element.date} 0${hour}:00:00`;
            else myDate = `${element.date} ${hour}:00:00`;

            let authors = '';
            if (Array.isArray(element.author)) { authors = element.author.join(', '); } else authors = element.author;

            sh.insert({
              link: element.fulltext_html_url,
              // eslint-disable-next-line no-useless-escape
              abstract: `(\'${escape(element.description)}\')`,
              authors: escape(authors),
              date: myDate,
              doi: `doi:${element.doi}`,
              title: escape(element.title),
              server: 'PeerJ Preprints',
            })
              .into('content_preprints')
              .run()
              .then(() => {
                // logger.info(`Inserted doi: ${element.doi} / ${myDate}`);
                inserted += 1;
              })
              .catch((e) => {
                logger.error(e);
                errored += 1;
              });
          }
        })
        .catch((e) => {
          logger.error(e);
          errored += 1;
        });
    });
  }

  setTimeout(() => {
    if (existed === 0 && fatalError === null) fatalError = '0 existed';
    logContinuity.logCrawlerEvent(sh, name, subject,
      { fatalError, intercepted, inserted, existed, errored });
  }, 5000);
};
