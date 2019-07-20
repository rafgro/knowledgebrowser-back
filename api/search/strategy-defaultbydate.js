/* eslint-disable max-len */

exports.provideQueries = function (sh, listOfResults, limitOfRelevancy, offsetAsNumber) {
  const arrayOfQueries = []; // is returned

  // idea: node is stalling during mapping results to weights when there are thousands of them,
  // so we need to pass to node only the last step of processing,
  // so we can: 1. divide results to two arrays - relevant and low relevancy (just one foreach!)
  // then: 2. ask for them in two queries BUT delegate sorting by date and limiting to faster postgres
  // then: 3. merge both queries and map only that part that will be sent by api
  // maybe three arrays: relevant, grey area (3-2/10) and then unrelevant (1/10)

  // 1
  const moreRelevantIds = [];
  const lessRelevantIds = [];
  listOfResults.forEach((pubWeight, pubId) => {
    // final division
    if (pubWeight > limitOfRelevancy) moreRelevantIds.push({ p: pubId, w: pubWeight });
    else lessRelevantIds.push({ p: pubId, w: pubWeight });
  });
  howManyRelevant = moreRelevantIds.length;

  // 2
  let moreRelevantNeeded = false;
  let moreRelevantOffset = 0;
  let moreRelevantLimit = 0;
  let lessRelevantNeeded = false;
  let lessRelevantOffset = 0;
  // let lessRelevantLimit = 0;

  // warning, it's just working voodoo down there
  if (moreRelevantIds.length > 0 && lessRelevantIds.length > 0) {
    if (offsetAsNumber === 0) {
      moreRelevantNeeded = true;
      moreRelevantOffset = 0;
      if (moreRelevantIds.length > 10) {
        moreRelevantLimit = 10;
        lessRelevantNeeded = false;
      } else {
        moreRelevantLimit = moreRelevantIds.length;
        lessRelevantNeeded = true;
        lessRelevantOffset = 0;
        if (lessRelevantIds.length > 10 - moreRelevantLimit) { lessRelevantLimit = 10 - moreRelevantLimit; } else lessRelevantLimit = lessRelevantIds.length;
      }
    } else if (offsetAsNumber < moreRelevantIds.length) {
      moreRelevantNeeded = true;
      moreRelevantOffset = offsetAsNumber;
      if (moreRelevantIds.length > offsetAsNumber + 10) {
        moreRelevantLimit = 10;
        lessRelevantNeeded = false;
      } else {
        moreRelevantLimit = moreRelevantIds.length - offsetAsNumber;
        lessRelevantNeeded = true;
        lessRelevantOffset = 0;
        if (lessRelevantIds.length > 10 - moreRelevantLimit) { lessRelevantLimit = 10 - moreRelevantLimit; } else lessRelevantLimit = lessRelevantIds.length;
      }
    } else {
      moreRelevantNeeded = false;
      lessRelevantNeeded = true;
      lessRelevantOffset = offsetAsNumber - moreRelevantIds.length;
      if (lessRelevantIds.length > offsetAsNumber + 10) {
        lessRelevantLimit = 10;
      } else {
        lessRelevantLimit = lessRelevantIds.length - offsetAsNumber;
      }
    }
  } else if (moreRelevantIds.length > 0) {
    moreRelevantNeeded = true;
    if (offsetAsNumber === 0) {
      moreRelevantOffset = 0;
      if (moreRelevantIds.length > 10) {
        moreRelevantLimit = 10;
      } else {
        moreRelevantLimit = moreRelevantIds.length;
      }
    } else {
      moreRelevantOffset = offsetAsNumber;
      if (moreRelevantIds.length > offsetAsNumber + 10) {
        moreRelevantLimit = 10;
      } else {
        moreRelevantLimit = moreRelevantIds.length - offsetAsNumber;
      }
    }
  } else if (lessRelevantIds.length > 0) {
    lessRelevantNeeded = true;
    if (offsetAsNumber === 0) {
      lessRelevantOffset = 0;
      if (lessRelevantIds.length > 10) {
        lessRelevantLimit = 10;
      } else {
        lessRelevantLimit = lessRelevantIds.length;
      }
    } else {
      lessRelevantOffset = offsetAsNumber;
      if (lessRelevantIds.length > offsetAsNumber + 10) {
        lessRelevantLimit = 10;
      } else {
        lessRelevantLimit = lessRelevantIds.length - offsetAsNumber;
      }
    }
  }

  if (moreRelevantNeeded) {
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
          '(' + moreRelevantIds.map(e => e.p).join(', ') + ')',
        )
        .orderBy('date', 'desc')
        .orderBy('id', 'asc')
        .limit(moreRelevantLimit, moreRelevantOffset),
    );
  }

  if (lessRelevantNeeded) {
    // dividing to more and less relevant one step further
    const furtherHigher = [];
    const furtherLower = [];
    const boundary = limitOfRelevancy * 0.8;
    lessRelevantIds.forEach((element) => {
      if (element.w > boundary) furtherHigher.push({ p: element.p, w: element.w });
      else furtherLower.push({ p: element.p, w: element.w });
    });

    // taking all from higher boundary first
    if (lessRelevantOffset + 10 < furtherHigher.length) {
      if (furtherHigher.length > 0) {
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
              '(' + furtherHigher.map(e => e.p).join(', ') + ')',
            )
            .orderBy('date', 'desc')
            .orderBy('id', 'asc')
            .limit(10, lessRelevantOffset),
        );
      }
    } else if (
      lessRelevantOffset + 10 >= furtherHigher.length
                && lessRelevantOffset < furtherHigher.length
    ) {
      // taking from both sides
      if (furtherHigher.length > 0 && furtherLower.length > 0) {
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
              '(' + furtherHigher.map(e => e.p).join(', ') + ')',
            )
            .orderBy('date', 'desc')
            .orderBy('id', 'asc')
            .limit(10, lessRelevantOffset),
        );
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
              '(' + furtherLower.map(e => e.p).join(', ') + ')',
            )
            .orderBy('date', 'desc')
            .orderBy('id', 'asc')
            .limit(10, 0),
        );
      // eslint-disable-next-line brace-style
      }
      // taking only from higher
      else if (furtherHigher.length > 0 && furtherLower.length === 0) {
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
              '(' + furtherHigher.map(e => e.p).join(', ') + ')',
            )
            .orderBy('date', 'desc')
            .orderBy('id', 'asc')
            .limit(10, lessRelevantOffset),
        );
      }
    } else {
      // taking from lower boundary if we are past higher
      // eslint-disable-next-line
      if (furtherLower.length > 0) {
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
              '(' + furtherLower.map(e => e.p).join(', ') + ')',
            )
            .orderBy('date', 'desc')
            .orderBy('id', 'asc')
            .limit(10, lessRelevantOffset - furtherHigher.length),
        );
      }
    }
  }

  return arrayOfQueries;
};
