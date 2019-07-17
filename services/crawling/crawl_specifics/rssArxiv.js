const striptags = require('striptags');
const logContinuity = require('./logContinuity');

exports.processRssBody = function (sh, body, name, subject) {
  let fatalError = null;
  let intercepted = 0;
  let inserted = 0;
  let existed = 0;
  let errored = 0;
  let updated = 0;

  if (Object.keys(body).length === 0) {
    fatalError = 'empty body';
  } else if (!Array.isArray(body['OAI-PMH'].ListRecords[0].record)) {
    fatalError = 'no array in body';
  } else if (body['OAI-PMH'].ListRecords[0].record[0].metadata[0]['oai_dc:dc'][0]['dc:identifier'][0] === undefined) {
    fatalError = 'unknown structure of entry';
  } else {
    intercepted = body['OAI-PMH'].ListRecords[0].record.length;

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
            existed += 1;
          }

          if (nonDuplicated === true) {
            // arxiv publishes in us nighttime which is 5 utc
            // but still shows yesterday's date
            // so we move it always one day ahead
            const todayDate = new Date(new Date(element['dc:date'][0]).getTime() + 1000 * 60 * 60 * 25 * 1);
            let myDate = ''; // format: 2019-06-04 08:00:00
            myDate = todayDate.getUTCFullYear()
              + (todayDate.getUTCMonth() + 1 < 10 ? '-0' : '-')
              + (todayDate.getUTCMonth() + 1)
              + (todayDate.getUTCDate() < 10 ? '-0' : '-')
              + todayDate.getUTCDate()
              + ' 05:00:00';

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
                // logger.info('Inserted ' + id + ' / ' + myDate);
                inserted += 1;
              })
              .catch((e) => {
                logger.error(e);
                errored += 1;
              });
          } else {
            // arxiv has specific culture for updates
            // with a lot of new and often significant changes
            // therefore we should update even duplicates

            // arxiv publishes in us nighttime which is 5 utc
            // but still shows yesterday's date
            // so we move it always one day ahead

            /* // DELETE THIS AFTER ONE RELEASE
            const todayDate = new Date(new Date(element['dc:date'][0])
              .getTime() + 1000 * 60 * 60 * 25 * 1);
            let myDate = ''; // format: 2019-06-04 08:00:00
            myDate = todayDate.getUTCFullYear()
              + (todayDate.getUTCMonth() + 1 < 10 ? '-0' : '-')
              + (todayDate.getUTCMonth() + 1)
              + (todayDate.getUTCDate() < 10 ? '-0' : '-')
              + todayDate.getUTCDate()
              + ' 05:00:00';
            // ^ DELETE THIS AFTER ONE RELEASE */

            const title = element['dc:title'][0].toString().replace(/\\\n/g, '');
            const abstract = striptags(element['dc:description'][0].toString().replace(/\\\n/g, ' ')).toString();
            const authors = element['dc:creator'].join(', ');
            const subjects = elementBig.header[0].setSpec.join(',');

            sh.update('content_preprints')
              .set({
                abstract:
                    "(\'"
                    + escape(abstract)
                    + "\')",
                authors: escape(authors),
                title: escape(title),
                sub: subjects,
              })
              .where('doi', '=', id)
              .run()
              .then(() => {
                // logger.info('Inserted ' + id + ' / ' + myDate);
                updated += 1;
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
      { fatalError, intercepted, inserted, existed, errored, updated });
  }, 45000);
};
