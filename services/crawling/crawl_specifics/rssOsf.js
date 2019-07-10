const logContinuity = require('./logContinuity');

exports.processRssBody = function (sh, body, name, subject) {
  let isContinuous = false;

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
          isContinuous = true;
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
