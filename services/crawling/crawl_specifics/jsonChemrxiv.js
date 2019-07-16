/* eslint-disable no-underscore-dangle */
const request = require('request');
const logContinuity = require('./logContinuity');

exports.processJsonBody = function (sh, body, name) {
  let anyErrors = false;

  setTimeout(() => {
    body.forEach((element) => {
      let nonDuplicated = false;

      sh.select('doi')
        .from('content_preprints')
        .where('doi', '=', `chemRxiv:${element.id}`)
        .run()
        .then((doi) => {
          if (doi.length === 0) {
            nonDuplicated = true;
          } else {
            isContinuous = true;
          }

          if (nonDuplicated === true) {
            request(element.url_public_api, { timeout: 5000 }, (e, r, b) => {
              if (e) {
                logger.error(e);
                anyErrors = true;
              } else {
                const received = JSON.parse(b);
                const authors = received.authors.map(a => a.full_name).join(', ');

                sh.insert({
                  link: element.url_public_html.toString().replace('figshare.com', 'chemrxiv.org'),
                  // eslint-disable-next-line no-useless-escape
                  abstract: `(\'${escape(received.description)}\')`,
                  authors: escape(authors),
                  date: element.timeline.firstOnline,
                  doi: `chemRxiv:${element.id}`,
                  title: escape(element.title),
                  server: 'chemRxiv',
                })
                  .into('content_preprints')
                  .run()
                  .then(() => {
                    // logger.info(`Inserted doi: ${element.doi} / ${element.timeline.firstOnline}`);
                  })
                  .catch((er) => {
                    logger.error(er);
                    anyErrors = true;
                  });
              }
            });
          }
        })
        .catch((e) => {
          logger.error(e);
          anyErrors = true;
        });
    });
  }, 1000);

  setTimeout(() => {
    logContinuity.logIt(sh, anyErrors, name, ' ');
  }, 3000);
};
