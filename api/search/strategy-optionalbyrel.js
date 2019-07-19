exports.provideQueries = function (sh, listOfResults, offsetAsNumber, span) {
  const arrayOfQueries = []; // is returned

  // idea: provide slice of ten from the most relevant pubs

  const sortedByWeight = [];
  listOfResults.forEach((pubWeight, pubId) => {
    sortedByWeight.push({ p: pubId, w: pubWeight });
  });

  sortedByWeight.sort((a, b) => b.w - a.w);

  let eventualOrder = sortedByWeight.slice(offsetAsNumber, offsetAsNumber + 10);
  if (span === 168) {
    eventualOrder = sortedByWeight.filter(v => v.p > 35000)
      .slice(offsetAsNumber, offsetAsNumber + 1500);
  }

  let primaryQuery = sh
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
      '(' + eventualOrder.map(e => e.p).join(', ') + ')',
    );

  if (span === 168) {
    // span (in hours) is timing limit for results
    const dateMinusSpan = new Date(Date.now() - span * 60 * 60 * 1000); // in ms
    const thatdate = dateMinusSpan.getUTCFullYear()
        + (dateMinusSpan.getUTCMonth() + 1 < 10 ? '-0' : '-')
        + (dateMinusSpan.getUTCMonth() + 1)
        + (dateMinusSpan.getUTCDate() < 10 ? '-0' : '-')
        + dateMinusSpan.getUTCDate()
        + (dateMinusSpan.getUTCHours() < 10 ? ' 0' : ' ')
        + dateMinusSpan.getUTCHours() + ':00:00'; // in utc as everywhere in db

    // appending date restriction to query
    primaryQuery = primaryQuery.and('date', '>=', thatdate);
  }

  eventualOrder.reverse().forEach((what) => {
    primaryQuery = primaryQuery.orderBy(`"id"=${what.p}`);
  });
  arrayOfQueries.push(primaryQuery);

  return arrayOfQueries;
};
