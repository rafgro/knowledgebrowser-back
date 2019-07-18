/* eslint-disable no-underscore-dangle */
const request = require('request');
const logContinuity = require('./logContinuity');

exports.processJsonBody = function (sh, body, name) {
  let fatalError = null;
  let intercepted = 0;
  let inserted = 0;
  let existed = 0;
  let errored = 0;

  if (Object.keys(body).length === 0) {
    fatalError = 'empty body';
  } else if (!Array.isArray(body)) {
    fatalError = 'no array in body';
  } else if (body[0].id === undefined) {
    fatalError = 'unknown structure of entry';
  } else {
    intercepted = body.length;

    body.forEach((element) => {
      setTimeout(() => {
        let nonDuplicated = false;

        sh.select('doi')
          .from('content_preprints')
          .where('doi', '=', `chemRxiv:${element.id}`)
          .run()
          .then((doi) => {
            if (doi.length === 0) {
              nonDuplicated = true;
            } else {
              existed += 1;
            }

            if (nonDuplicated === true) {
              request(element.url_public_api, { timeout: 5000 }, (e, r, b) => {
                if (e) {
                  logger.error(e);
                  errored += 1;
                } else {
                  const received = JSON.parse(b);
                  const authors = received.authors.map(a => a.full_name).join(', ');

                  sh.insert({
                    link: element.url_public_html.toString().replace('figshare.com', 'chemrxiv.org'),
                    // eslint-disable-next-line no-useless-escape
                    abstract: `(\'${escape(received.description)}\')`,
                    authors: escape(authors),
                    // date: element.timeline.firstOnline,
                    date: element.timeline.onlinePublication,
                    doi: `chemRxiv:${element.id}`,
                    title: escape(element.title),
                    server: 'chemRxiv',
                  })
                    .into('content_preprints')
                    .run()
                    .then(() => {
                      inserted += 1;
                    })
                    .catch((er) => {
                      logger.error(er);
                      errored += 1;
                    });
                }
              });
            }
          })
          .catch((e) => {
            logger.error(e);
            errored += 1;
          });
      }, 1000);
    });
  }

  setTimeout(() => {
    if (existed === 0 && fatalError === null) fatalError = '0 existed';
    logContinuity.logCrawlerEvent(sh, name, ' ',
      { fatalError, intercepted, inserted, existed, errored });
  }, 45000);
};
