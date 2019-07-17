const logContinuity = require('./logContinuity');

exports.processRssBody = function (sh, body, name, subject) {
  let fatalError = null;
  let intercepted = 0;
  let inserted = 0;
  let existed = 0;
  let errored = 0;

  if (Object.keys(body).length === 0) {
    fatalError = 'empty body';
  } else if (!Array.isArray(body['rdf:RDF']['rss:item'])) {
    fatalError = 'no array in body';
  } else if (body['rdf:RDF']['rss:item'][0]['rss:link'] === undefined) {
    fatalError = 'unknown structure of entry';
  } else {
    intercepted = body['rdf:RDF']['rss:item'].length;

    body['rdf:RDF']['rss:item'].forEach((element) => {
      let nonDuplicated = false;

      if (element['rss:link'] !== undefined) {
        let lastPos = element['rss:link'].toString().lastIndexOf('&');
        if (lastPos < 1) lastPos = element['rss:link'].toString().length;
        const id = element['rss:link'].toString().substring(23, lastPos);

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
              let myAuthors = '';
              if (Array.isArray(element['dc:creator'])) {
                myAuthors = element['dc:creator']
                  .map(val => val.replace(',', ''))
                  .join(', ');
              } else myAuthors = element['dc:creator'].toString();

              const hour = new Date().getUTCHours();
              const date = new Date(Date.now());
              const today = date.getUTCFullYear()
                  + (date.getUTCMonth() + 1 < 10 ? '-0' : '-')
                  + (date.getUTCMonth() + 1)
                  + (date.getUTCDate() < 10 ? '-0' : '-')
                  + date.getUTCDate();
              let myDate = element['dc:date'] || today; // format: 2019-06-04 08:00:00
              if (myDate.length === 7) myDate += '-01';
              if (myDate.length === 4) myDate += '-01-01';
              if (hour < 10) myDate += ' 0' + hour + ':00:00';
              else myDate += ' ' + hour + ':00:00';
              if (myDate.length >= 19) {
                sh.insert({
                  link: element['rss:link'],
                  abstract: "(\'" + escape(element['rss:description']) + "\')",
                  authors: myAuthors,
                  date: myDate,
                  doi: id,
                  title: escape(element['rss:title']),
                  server: 'NEP RePEc',
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
