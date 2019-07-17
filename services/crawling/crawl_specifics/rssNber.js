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

      let lastPos = element.link.toString().lastIndexOf('#');
      if (lastPos < 1) lastPos = element.link.toString().length;
      const id = 'nber:' + element.link.toString().substring(30, lastPos);

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
            let myTitle = '';
            let myAuthors = '';
            const lastPos2 = element.title.toString().lastIndexOf(' -- by');
            if (lastPos2 > 1) {
              myTitle = element.title.toString().substring(0, lastPos2);
              myAuthors = element.title.toString().substring(lastPos2 + 7);
            } else {
              myTitle = element.title.toString();
            }

            const hour = new Date().getUTCHours();
            const date = new Date(Date.now());
            let myDate = ''; // format: 2019-06-04 08:00:00
            if (hour < 10) {
              myDate = date.getUTCFullYear()
                + (date.getUTCMonth() + 1 < 10 ? '-0' : '-')
                + (date.getUTCMonth() + 1)
                + (date.getUTCDate() < 10 ? '-0' : '-')
                + date.getUTCDate()
                + ' 0'
                + hour
                + ':00:00';
            } else {
              myDate = date.getUTCFullYear()
                + (date.getUTCMonth() + 1 < 10 ? '-0' : '-')
                + (date.getUTCMonth() + 1)
                + (date.getUTCDate() < 10 ? '-0' : '-')
                + date.getUTCDate()
                + ' '
                + hour
                + ':00:00';
            }

            sh.insert({
              link: element.link,
              abstract: "(\'" + escape(element.description) + "\')",
              authors: myAuthors,
              date: myDate,
              doi: id,
              title: escape(myTitle),
              server: 'NBER',
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
    });
  }

  setTimeout(() => {
    if (existed === 0 && fatalError === null) fatalError = '0 existed';
    logContinuity.logCrawlerEvent(sh, name, subject,
      { fatalError, intercepted, inserted, existed, errored });
  }, 5000);
};
