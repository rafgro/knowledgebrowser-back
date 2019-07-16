/* eslint-disable no-param-reassign */

const logContinuity = require('./logContinuity');

exports.processRssBody = function (sh, body, name, subject) {
  /* let isContinuous = false;
  let anyErrors = false;

  body.rss.channel[0].item.forEach((element) => {
    const chemrxivDoi = 'chemRxiv:'
      + element.link
        .toString()
        .substring(element.link.toString().lastIndexOf('/') + 1);
    let nonDuplicated = false;

    sh.select('doi')
      .from('content_preprints')
      .where('doi', '=', chemrxivDoi)
      .run()
      .then((doi) => {
        if (doi.length === 0) {
          nonDuplicated = true;
        } else {
          isContinuous = true;
        }

        if (nonDuplicated === true) {
          sh.insert({
            link: element.link,
            abstract: "(\'" + escape(element.description) + "\')",
            authors: '',
            date: element.pubDate.toString(),
            doi: chemrxivDoi,
            title: escape(element.title),
            server: 'chemRxiv',
          })
            .into('content_preprints')
            .run()
            .then(() => {
              // logger.info('Inserted ' + chemrxivDoi + ' / ' + element.pubDate.toString());
            })
            .catch((e) => {
              logger.error(e);
              anyErrors = true;
            });
        }
      })
      .catch((e) => {
        logger.error(e);
        anyErrors = true;
      });
  });

  setTimeout(() => {
    logContinuity.logIt(sh, isContinuous, name, subject, anyErrors);
  }, 3000); */
};
