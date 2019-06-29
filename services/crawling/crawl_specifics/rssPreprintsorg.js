const logContinuity = require('./logContinuity');

exports.processRssBody = function (sh, body, name) {
  let isContinuous = false;

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
            isContinuous = true;
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
                logger.info('Inserted ' + id + ' / ' + myDate);
              })
              .catch((e) => {
                logger.error(e.toString());
              });
          }
        })
        .catch((e) => {
          logger.error(e.toString());
        });
    }
  });

  setTimeout(() => {
    logContinuity.logIt(sh, isContinuous, name);
  }, 3000);
};
