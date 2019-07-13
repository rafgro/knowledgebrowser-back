const striptags = require('striptags');
const logContinuity = require('./logContinuity');

exports.processRssBody = function (sh, body, name, subject) {
  let isContinuous = false;

  body['rdf:RDF'].item.forEach((element) => {
    let nonDuplicated = false;
    const id = 'arXiv:' + element.link.toString().substring(21);

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
          // arxiv provides updates of publications in rss and clever way
          // to find only new pubs is to look for 'v1' in title
          if (element.title.toString().includes('v1')) {
            // new preprint
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

            const title = element.title.toString()
              .replace(/\\"/g, '')
              .replace(/\{/g, '')
              .replace(/\}/g, '');

            const abstract = striptags(element.description[0]._.toString()).toString()
              .replace(/\\"/g, '')
              .replace(/\{/g, '')
              .replace(/\}/g, '');

            sh.insert({
              link: element.link,
              abstract:
                "(\'"
                + escape(abstract)
                + "\')",
              authors: escape(striptags(element['dc:creator'].toString())),
              date: myDate,
              doi: id,
              title: escape(title),
              server: 'arXiv',
              sub: subject,
            })
              .into('content_preprints')
              .run()
              .then(() => {
                // logger.info('Inserted ' + id + ' / ' + myDate);
              })
              .catch((e) => {
                logger.error(e);
              });
          }
        } else {
          const tituli = element.title.toString();
          // we can still update existing preprints
          if (
            tituli.includes('v2')
            || tituli.includes('v3')
            || tituli.includes('v4')
            || tituli.includes('v5')
          ) {
            // const hour = (new Date()).getUTCHours();
            // const date = new Date(Date.now());
            // const myDate = '2019-04-01 00:00:00';

            const title = element.title.toString()
              .replace(/\\"/g, '')
              .replace(/\{/g, '')
              .replace(/\}/g, '');

            const abstract = striptags(element.description[0]._.toString()).toString()
              .replace(/\\"/g, '')
              .replace(/\{/g, '')
              .replace(/\}/g, '');

            sh.update('content_preprints')
              .set({
                link: element.link,
                abstract:
                  "('"
                  + escape(abstract)
                  + "')",
                authors: escape(striptags(element['dc:creator'].toString())),
                // date: myDate,
                doi: id,
                title: escape(title),
                server: 'arXiv',
                sub: subject,
              })
              .where('doi', '=', id)
              .run()
              .then(() => {
                // logger.info('Updated ' + id + ' / ' + myDate);
              })
              .catch((e) => {
                logger.error(e);
              });
          }
        }
      })
      .catch((e) => {
        logger.error(e);
      });
  });

  setTimeout(() => {
    logContinuity.logIt(sh, isContinuous, name, subject);
  }, 3000);
};
