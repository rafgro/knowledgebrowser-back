const logContinuity = require('./logContinuity');

exports.processRssBody = function (sh, body, name, subject) {
  let fatalError = null;
  let intercepted = 0;
  let inserted = 0;
  let existed = 0;
  let errored = 0;

  if (Object.keys(body).length === 0) {
    fatalError = 'empty body';
  } else if (!Array.isArray(body['rdf:RDF'].item)) {
    fatalError = 'no array in body';
  } else if (body['rdf:RDF'].item[0]['dc:identifier'] === undefined) {
    fatalError = 'unknown structure of entry';
  } else {
    intercepted = body['rdf:RDF'].item.length;

    body['rdf:RDF'].item.forEach((element) => {
      let nonDuplicated = false;

      sh.select('doi')
        .from('content_preprints')
        .where('doi', '=', element['dc:identifier'])
        .run()
        .then((doi) => {
          if (doi.length === 0) {
            nonDuplicated = true;
          } else {
            existed += 1;
          }

          if (nonDuplicated === true) {
            const hour = new Date().getUTCHours();
            let myDate = ''; // format: 2019-06-04 08:00:00
            if (hour < 10) myDate = element['dc:date'] + ' 0' + hour + ':00:00';
            else myDate = element['dc:date'] + ' ' + hour + ':00:00';

            sh.insert({
              link: element.link.toString().replace('\n', ''),
              abstract: "(\'" + escape(element.description) + "\')",
              authors: escape(element['dc:creator']),
              date: myDate,
              doi: element['dc:identifier'],
              title: escape(element['dc:title']),
              server: 'bioRxiv',
              sub: subject,
            })
              .into('content_preprints')
              .run()
              .then(() => {
                // logger.info('Inserted ' + element['dc:identifier'] + ' / ' + myDate);
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
