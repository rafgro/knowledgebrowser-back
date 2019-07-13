exports.provideQueries = function (sh, listOfResults, limitOfRelevancy, span) {
  const arrayOfQueries = []; // is returned

  // idea: provide all with relevancy over limit
  const relevantIds = [];
  listOfResults.forEach((pubWeight, pubId) => {
    // getting only those over limit
    if (pubWeight > limitOfRelevancy) { relevantIds.push({ p: pubId, w: pubWeight }); }
  });

  if (relevantIds.length > 0) {
    // span (in hours) is timing limit for results
    const dateMinusSpan = new Date(Date.now() - span * 60 * 60 * 1000); // in ms
    const thatdate = dateMinusSpan.getUTCFullYear()
        + (dateMinusSpan.getUTCMonth() + 1 < 10 ? '-0' : '-')
        + (dateMinusSpan.getUTCMonth() + 1)
        + (dateMinusSpan.getUTCDate() < 10 ? '-0' : '-')
        + dateMinusSpan.getUTCDate()
        + (dateMinusSpan.getUTCHours() < 10 ? ' 0' : ' ')
        + dateMinusSpan.getUTCHours() + ':00:00'; // in utc as everywhere in db

    arrayOfQueries.push(
      sh
        .select(
          'id',
          'title',
          'authors',
          'abstract',
          'doi',
          'link',
          'date',
          'server',
        )
        .from('content_preprints')
        .where(
          'id',
          'IN',
          '(' + relevantIds.map(e => e.p).join(', ') + ')',
        )
        .and(
          'date',
          '>=',
          thatdate,
        )
        .orderBy('date', 'desc')
        .orderBy('id', 'asc')
        .limit(100),
    );
  } else {
    reject({
      message:
          'Sorry, there are no sufficiently relevant results for <i>' + query + '</i>.',
    });
  }

  return arrayOfQueries;
};
