const logContinuity = require('./logContinuity');

exports.processRssBody = function (sh, body, name, subject) {
  let fatalError = null;
  let intercepted = 0;
  let inserted = 0;
  let existed = 0;
  let errored = 0;

  if (Object.keys(body).length === 0) {
    fatalError = 'empty body';
  } else if (!Array.isArray(body.feed.entry)) {
    fatalError = 'no array in body';
  } else if (body.feed.entry[0].id === undefined) {
    fatalError = 'unknown structure of entry';
  } else {
    intercepted = body.feed.entry.length;

    body.feed.entry.forEach((element) => {
      let nonDuplicated = false;
      const id = 'osf:' + element.id.toString().substring(30);

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
            let allNames = element.author.reduce(
              (acc, val) => val.name + ', ' + acc,
              '',
            );
            allNames = allNames.substring(0, allNames.length - 2);

            const tags = element.category
              .reduce((acc, val) => val.$.term + '|' + acc, '')
              .split('|');
            const arrayOfOSFarchives = [
              'AgriXiv',
              'BodoArXiv',
              'EarthArXiv',
              'EcoEvoRxiv',
              'ECSarXiv',
              'engrXiv',
              'LawArXiv',
              'MarXiv',
              'MediArXiv',
              'MetaArXiv',
              'MindRxiv',
              'NutriXiv',
              'PaleorXiv',
              'PsyArXiv',
              'SocArXiv',
              'SportRxiv',
              'LIS Scholarship Archive',
              'Ecology and Evolutionary Biology',
            ];
            let ourServer = '';
            // eslint-disable-next-line no-restricted-syntax
            for (const archive of arrayOfOSFarchives) {
              if (tags.includes(archive)) {
                if (archive === 'Ecology and Evolutionary Biology') {
                  ourServer = 'EcoEvoRxiv';
                } else {
                  ourServer = archive;
                }
                break;
              }
            }

            if (element.published !== undefined && ourServer.length > 3) {
              sh.insert({
                link: element.id,
                abstract: "(\'" + escape(element.summary[0]._) + "\')",
                authors: escape(allNames),
                date: element.published,
                doi: id,
                title: escape(element.title),
                server: ourServer,
              })
                .into('content_preprints')
                .run()
                .then(() => {
                  // logger.info('Inserted ' + id + ' / ' + element.published);
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
    });
  }

  setTimeout(() => {
    if (existed === 0 && fatalError === null) fatalError = '0 existed';
    logContinuity.logCrawlerEvent(sh, name, subject,
      { fatalError, intercepted, inserted, existed, errored });
  }, 5000);
};
