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
            sh.insert({
              link: element['prism:url'],
              abstract: ' ',
              authors: escape(
                element['dc:creator'].toString().replace(/\\\n/g, ''),
              ),
              date: element['prism:coverDate'].toString().substring(0, 18),
              doi: element['dc:identifier'],
              title: escape(element['dc:title']),
              server: 'ESSOAr',
            })
              .into('content_preprints')
              .run()
              .then(() => {
                /* logger.info(
                  'Inserted '
                    + element['dc:identifier']
                    + ' / '
                    + element['prism:coverDate'],
                ); */
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
