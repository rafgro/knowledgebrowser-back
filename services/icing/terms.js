/* eslint-disable max-len */
/* eslint-disable no-console */
exports.process = function (sh, terms, hotnessBoundary) {
  const arrayOfScores = [];

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
    let score = 0;
    let noOfPubs = 0;
    allPubs.forEach((pub) => {
      if (parseInt(pub.p, 10) >= hotnessBoundary) {
        score += parseFloat(pub.w, 10);
        noOfPubs += 1;
      }
    });
    // console.log(score);

    // quickfix to break dominance of single words
    let noOfSpaces = term.term.split(' ').length - 1;
    if (noOfSpaces > 2) noOfSpaces = 2;
    else if (noOfSpaces < 1) noOfSpaces = 0.1;
    let maxing = noOfPubs;
    if (maxing > 30) maxing = 0.5; // downweight for common parts of speech
    if (maxing > 10) maxing = 3.5; // downweight for common terms
    if (maxing > 7) maxing = 7; // reasonable limit of 7 pubs per week
    noOfSpaces *= maxing;
    score *= noOfSpaces;

    // 3
    if (score > 0) arrayOfScores.push({ t: term.term, s: score, n: noOfPubs });
  });

  // we upload to the db only 50 most popular in that batch
  let sorted = arrayOfScores.sort((a, b) => b.s - a.s).slice(0, 50);
  sorted = sorted.map((value) => {
    // eslint-disable-next-line no-param-reassign
    value.s = value.s.toFixed(0);
    return value;
  });

  const date = new Date(Date.now());
  const today = date.getUTCFullYear()
    + (date.getUTCMonth() + 1 < 10 ? '-0' : '-')
    + (date.getUTCMonth() + 1)
    + (date.getUTCDate() < 10 ? '-0' : '-')
    + date.getUTCDate();
  sh.select('type', 'date', 'rawterms').from('icing_stats').where('date', '=', today).and('type', '=', 'a')
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
        sh.update('icing_stats').set('rawterms', '\'' + allToInsert + '\'').where('date', '=', today).run()
          .then(() => logger.info('Good'))
          .catch(e => logger.info(e));
        logger.info('End of icing work');
      } else {
        // first entry of the day
        sh.insert({ type: 'a', date: today, rawterms: '\'' + JSON.stringify(sorted) + '\'' }).into('icing_stats').run()
          .then(() => logger.info('Good'))
          .catch(e => logger.info(e));
        logger.info('End of icing work');
      }
    })
    .catch(e => logger.info(e));
};
