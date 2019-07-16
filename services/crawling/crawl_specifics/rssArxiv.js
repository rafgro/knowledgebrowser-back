const striptags = require('striptags');
const logContinuity = require('./logContinuity');

exports.processRssBody = function (sh, body, name, subject) {
  let anyErrors = false;

  body['OAI-PMH'].ListRecords[0].record.forEach((elementBig) => {
    const element = elementBig.metadata[0]['oai_dc:dc'][0];

    let nonDuplicated = false;
    const id = 'arXiv:' + element['dc:identifier'][0].toString().substring(21);

    sh.select('doi')
      .from('content_preprints')
      .where('doi', '=', id)
      .run()
      .then((doi) => {
        if (doi.length === 0) {
          nonDuplicated = true;
        } else {
          // isContinuous = true;
        }

        if (nonDuplicated === true) {
          const hour = new Date().getUTCHours();
          let myDate = ''; // format: 2019-06-04 08:00:00
          myDate = element['dc:date'][0]
            + ' 0'
            + hour
            + ':00:00';

          const title = element['dc:title'][0].toString().replace(/\\\n/g, '');
          const abstract = striptags(element['dc:description'][0].toString().replace(/\\\n/g, ' ')).toString();
          const authors = element['dc:creator'].join(', ');
          const subjects = elementBig.header[0].setSpec.join(',');

          sh.insert({
            link: element['dc:identifier'][0],
            abstract:
                "(\'"
                + escape(abstract)
                + "\')",
            authors: escape(authors),
            date: myDate,
            doi: id,
            title: escape(title),
            server: 'arXiv',
            sub: subjects,
          })
            .into('content_preprints')
            .run()
            .then(() => {
              logger.info('Inserted ' + id + ' / ' + myDate);
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
    logContinuity.logIt(sh, anyErrors, name, subject);
  }, 20000);
};
