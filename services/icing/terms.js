/* eslint-disable max-len */
/* eslint-disable no-console */
exports.process = async function (hrstart, sh, terms, hotnessBoundary, specializedObj) {
  const processingEntities = [];

  // first - all preprints in the last week
  processingEntities.push({ arrayOfScores: [], type: 'a' });

  // then - special categories for preprints
  for (let i = 0; i < specializedObj.length; i += 1) {
    // used for instead of promise.all to have sequential addition
    // eslint-disable-next-line no-await-in-loop
    const ids = await provideIds(sh, specializedObj[i].dateFrom, specializedObj[i].servers, specializedObj[i].subs);
    if (ids.length > 0) {
      processingEntities.push({
        arrayOfScores: [],
        type: specializedObj[i].type,
        ids,
      });
    }
  }

  terms.forEach((term) => {
    // stategy:
    // 0. determine after which id we have new pubs and after which we have old (hotness boundary)
    // 1. merge all pubs in both titles and relevancies
    // 2. produce score which is simple sum of weights for ids after boundary
    // 3. save score to the array, then sort it and upload to db

    // 1
    let allPubs = [];
    if (term.relevant !== null) allPubs = JSON.parse(term.relevant);
    if (term.relevant_abstract !== null) allPubs = allPubs.concat(JSON.parse(term.relevant_abstract));

    // 2
    const distinctScores = [];
    const mapsOfOriginalPubs = [];
    // eslint-disable-next-line no-unused-vars
    processingEntities.forEach((_v) => {
      distinctScores.push(0);
      mapsOfOriginalPubs.push(new Map());
    });
    allPubs.forEach((pub) => {
      if (parseInt(pub.p, 10) >= hotnessBoundary) {
        distinctScores[0] += parseFloat(pub.w, 10);
        mapsOfOriginalPubs[0].set('' + pub.p, parseFloat(pub.w, 10));
      }
      for (let i = 1; i < mapsOfOriginalPubs.length; i += 1) {
        if (processingEntities[i].ids.includes(parseInt(pub.p, 10))) {
          distinctScores[i] += parseFloat(pub.w, 10);
          mapsOfOriginalPubs[i].set('' + pub.p, parseFloat(pub.w, 10));
        }
      }
    });

    // manipulations on scores
    for (let i = 0; i < distinctScores.length; i += 1) {
      const noOfPubs = mapsOfOriginalPubs[i].size;

      // general has different procedure
      if (i === 0) {
        // quickfix to break dominance of single words
        let noOfSpaces = term.term.split(' ').length - 1;
        if (noOfSpaces >= 2) noOfSpaces = 3;
        else if (noOfSpaces < 1) noOfSpaces = 0.15;
        let maxing = noOfPubs;
        if (maxing > 500) maxing = 0; // excluding common parts of speech
        if (maxing > 14) maxing = 14; // reasonable upper limit of 14 pubs per week
        if (maxing < 4) maxing = 0.5; // reasonable bottom limit of minimum 4 pubs per week
        noOfSpaces *= maxing;
        distinctScores[i] *= noOfSpaces;
      } else {
        // quickfix to break dominance of single words
        let noOfSpaces = term.term.split(' ').length - 1;
        if (noOfSpaces >= 2) noOfSpaces = 3;
        else if (noOfSpaces < 1) noOfSpaces = 0.025;
        let maxing = noOfPubs;
        if (maxing > 50 && noOfSpaces < 1) maxing = 0; // excluding common parts of speech
        if (maxing > 7) maxing = 7; // reasonable upper limit of 7 pubs per week
        if (maxing < 2) maxing = 0; // minimum 2 publications in the last week
        noOfSpaces *= maxing;
        distinctScores[i] *= noOfSpaces;
      }

      // 3
      if (distinctScores[i] > 1) {
        processingEntities[i].arrayOfScores.push({ t: term.term, s: distinctScores[i], n: noOfPubs });
      }
    }
  });

  processingEntities.forEach((one) => {
    // we upload to the db only 30 most popular in that batch
    let sorted = one.arrayOfScores.sort((a, b) => b.s - a.s).slice(0, 30);
    sorted = sorted.map((value) => {
      // eslint-disable-next-line no-param-reassign
      value.s = value.s.toFixed(0);
      return value;
    });

    if (sorted.length > 0 && sorted[0].s !== '0') {
      const date = new Date(Date.now());
      const today = date.getUTCFullYear()
        + (date.getUTCMonth() + 1 < 10 ? '-0' : '-')
        + (date.getUTCMonth() + 1)
        + (date.getUTCDate() < 10 ? '-0' : '-')
        + date.getUTCDate();
      sh.select('type', 'date', 'rawterms').from('icing_stats').where('date', '=', today).and('type', '=', one.type)
        .run()
        .then((returned) => {
          if (Object.keys(returned).length !== 0) {
            // entry is present
            let allToInsert = '';
            if (returned[0].rawterms != null) {
              allToInsert = returned[0].rawterms.substring(0, returned[0].rawterms.length - 1)
                + ','
                + JSON.stringify(sorted).substring(1);
            } else {
              allToInsert = JSON.stringify(sorted);
            }
            sh.update('icing_stats')
              .set('rawterms', '\'' + allToInsert + '\'')
              .where('date', '=', today).and('type', '=', one.type)
              .run()
              .then(() => logger.info('Good'))
              .catch(e => logger.error(e));
            logger.info('End of icing work for ' + one.type + ' with ' + sorted.length);
            const hrend = new Date() - hrstart;
            logger.info('Lasted ' + hrend / 1000 + ' s');
          } else {
            // first entry of the day
            sh.insert({ type: one.type, date: today, rawterms: '\'' + JSON.stringify(sorted) + '\'' }).into('icing_stats').run()
              .then(() => logger.info('Good'))
              .catch(e => logger.error(e));
            logger.info('End of icing work for ' + one.type + ' with ' + sorted.length);
            const hrend = new Date() - hrstart;
            logger.info('Lasted ' + hrend / 1000 + ' s');
          }
        })
        .catch(e => logger.error(e));
    }
  });
};

function provideIds(sh, dateFrom, servers, subs) {
  return new Promise((resolve, reject) => {
    let queryForIds = sh.select('id').from('content_preprints').where('date', '>=', dateFrom);
    if (servers != null && subs == null) {
      // only servers
      if (servers.length === 1) queryForIds = queryForIds.and('server', '=', servers[0]);
      else {
        let innerQuery = sh.if('server', '=', servers[0]);
        for (let i = 1; i < servers.length; i += 1) {
          innerQuery = innerQuery.or('server', '=', servers[i]);
        }
        queryForIds = queryForIds.and(innerQuery);
      }
    } else if (servers != null && subs != null) {
      // both servers and subs
      let innerQuery1 = sh.if('server', '=', servers[0]);
      for (let i = 1; i < servers.length; i += 1) {
        innerQuery1 = innerQuery1.or('server', '=', servers[i]);
      }
      let innerQuery2 = sh.if('sub', '=', subs[0]);
      for (let i = 1; i < servers.length; i += 1) {
        innerQuery2 = innerQuery2.or('sub', '=', subs[i]);
      }
      queryForIds = queryForIds.and(
        sh.if(innerQuery1)
          .or(innerQuery2),
      );
    } else if (servers == null && subs != null) {
      // only subs
      if (subs.length === 1) queryForIds = queryForIds.and('sub', '=', subs[0]);
      else {
        let innerQuery = sh.if('sub', '=', subs[0]);
        for (let i = 1; i < subs.length; i += 1) {
          innerQuery = innerQuery.or('sub', '=', subs[i]);
        }
        queryForIds = queryForIds.and(innerQuery);
      }
    }
    queryForIds.run()
      .then((res) => {
        resolve(res.map(v => v.id));
      })
      .catch((e) => {
        logger.error(e);
        reject(e);
      });
  });
}
