const logContinuity = require('./logContinuity');

exports.processRssBody = function (sh, body, name, subject) {
  let isContinuous = false;

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
            isContinuous = true;
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
              })
              .catch((e) => {
                logger.error(e);
              });
          }
        })
        .catch((e) => {
          logger.error(e);
        });
    }
  });

  setTimeout(() => {
    logContinuity.logIt(sh, isContinuous, name, subject);
  }, 3000);
};
