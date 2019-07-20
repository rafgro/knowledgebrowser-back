const striptags = require('striptags');
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
  } else if (body.rss.channel[0].item[0].description === undefined) {
    fatalError = 'unknown structure of entry';
  } else {
    intercepted = body.rss.channel[0].item.length;

    body.rss.channel[0].item.forEach((element) => {
      let nonDuplicated = false;

      const worked = striptags(element.description.toString()).replace(
        /  +/g,
        ' ',
      );
      const myDoi = worked.substring(
        worked.indexOf('reference: ') + 11,
        worked.indexOf('\n', worked.indexOf('reference: ') + 3),
      );

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
            const myAuthors = worked.substring(
              worked.indexOf('authors: ') + 9,
              worked.indexOf('\n', worked.indexOf('authors: ') + 3),
            );
            const myDate = worked.substring(
              worked.indexOf('date: ') + 6,
              worked.indexOf('\n', worked.indexOf('date: ') + 3),
            );
            const myAbstract = worked.substring(
              worked.indexOf('abstract: ') + 11,
            );

            if (
              element.title.toString().charAt(0) !== '&'
              && myAbstract.includes('Title, authors and abstract should also')
              && !myAuthors.includes('Rajna')
              && !myAuthors.includes('Colin James')
                === false
            ) {
              sh.insert({
                link: element.link,
                abstract: "(\'" + escape(myAbstract) + "\')",
                authors: myAuthors,
                date: myDate,
                doi: myDoi,
                title: escape(element.title),
                server: 'viXra',
                sub: element.category,
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
