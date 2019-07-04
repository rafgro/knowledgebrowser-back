const logContinuity = require('./logContinuity');

exports.processRssBody = function (sh, body, name, subject) {
  let isContinuous = false;

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
          isContinuous = true;
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
              logger.info(
                'Inserted ' + element['dc:identifier'] + ' / ' + myDate,
              );
            })
            .catch((e) => {
              logger.error(JSON.stringify(e));
            });
        }
      })
      .catch((e) => {
        logger.error(JSON.stringify(e));
      });
  });

  setTimeout(() => {
    logContinuity.logIt(sh, isContinuous, name, subject);
  }, 3000);
};
