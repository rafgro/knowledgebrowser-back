const logContinuity = require('./logContinuity');

exports.processRssBody = function (sh, body, name, subject) {
  let fatalError = null;
  let intercepted = 0;
  let inserted = 0;
  let existed = 0;
  let errored = 0;

  if (Object.keys(body).length === 0) {
    fatalError = 'empty body';
  } else if (!Array.isArray(body.rss.channel[0].item)) {
    fatalError = 'no array in body';
  } else if (body.rss.channel[0].item[0].doi === undefined) {
    fatalError = 'unknown structure of entry';
  } else {
    intercepted = body.rss.channel[0].item.length;

    body.rss.channel[0].item.forEach((element) => {
      let nonDuplicated = false;
      const id = 'doi:' + element.doi;
      if (element.doi !== undefined) {
        sh.select('doi')
          .from('content_preprints')
          .where('doi', '=', id)
          .run()
          .then((doi) => {
            if (doi.length === 0) {
              nonDuplicated = true;
            } else {
              existed += 1;
            }

            if (nonDuplicated === true) {
              const myDate = new Date(element.pubDate);

              sh.insert({
                link: element.link,
                abstract: "(\'" + escape(element.description) + "\')",
                authors: ' ',
                date: myDate,
                doi: id,
                title: escape(element.title),
                server: 'Preprints.org',
              })
                .into('content_preprints')
                .run()
                .then(() => {
                  // logger.info('Inserted ' + id + ' / ' + myDate);
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
      }
    });
  }

  setTimeout(() => {
    if (existed === 0 && fatalError === null) fatalError = '0 existed';
    logContinuity.logCrawlerEvent(sh, name, subject,
      { fatalError, intercepted, inserted, existed, errored });
  }, 5000);
};
