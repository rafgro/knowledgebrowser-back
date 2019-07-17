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
  } else if (body.rss.channel[0].item[0].link === undefined) {
    fatalError = 'unknown structure of entry';
  } else {
    intercepted = body.rss.channel[0].item.length;

    body.rss.channel[0].item.forEach((element) => {
      let nonDuplicated = false;

      if (element.description.toString().includes('Preprint')) {
        const myDoi = 'philsci:'
          + element.link
            .toString()
            .substring(32, element.link.toString().length - 1);

        sh.select('doi')
          .from('content_preprints')
          .where('doi', '=', myDoi)
          .run()
          .then((doi) => {
            if (doi.length === 0) {
              nonDuplicated = true;
            } else {
              existed += 1;
            }

            if (nonDuplicated === true) {
              const myAuthors = element.description
                .toString()
                .substring(0, element.description.toString().indexOf('(') - 1);
              const myTitle = element.description
                .toString()
                .substring(
                  element.description.toString().indexOf(')') + 2,
                  element.description.toString().lastIndexOf('[Pr'),
                );
              const myDate = new Date(element.pubDate);

              sh.insert({
                link: element.link,
                abstract: ' ',
                authors: myAuthors,
                date: myDate,
                doi: myDoi,
                title: escape(myTitle),
                server: 'PhilSci',
              })
                .into('content_preprints')
                .run()
                .then(() => {
                  // logger.info('Inserted ' + myDoi + ' / ' + myDate);
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
