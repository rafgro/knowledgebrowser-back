exports.provideQueries = function (sh, listOfResults, offsetAsNumber) {
  const arrayOfQueries = []; // is returned

  // idea: provide slice of ten from the most relevant pubs

  const sortedByWeight = [];
  listOfResults.forEach((pubWeight, pubId) => {
    sortedByWeight.push({ p: pubId, w: pubWeight });
  });

  sortedByWeight.sort((a, b) => b.w - a.w);

  const eventualOrder = sortedByWeight.slice(offsetAsNumber, offsetAsNumber + 10);

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
  eventualOrder.reverse().forEach((what) => {
    primaryQuery = primaryQuery.orderBy(`"id"=${what.p}`);
  });
  arrayOfQueries.push(primaryQuery);

  return arrayOfQueries;
};
