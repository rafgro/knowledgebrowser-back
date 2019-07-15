/* eslint-disable max-len */

const relativeWeightModule = require('./relative-weights');

exports.assemble = function (result, queriesMap, workingQueries, minRelevance) {
  // four consts returned in object
  const originalMultipliedRelevant = new Map(); // final list of pubs and weights
  const scopesOfPubsTitle = new Map(); // coverage of pub vs query in title
  const scopesOfPubs = new Map(); // coverage of pub vs query in all fields
  const originalTerms = []; // for adding strong around words

  // multiplication of query weights by result weights
  for (let i = 0; i < result.length; i += 1) {
    const queryWeight = queriesMap.get(result[i].term).w;
    const queryScope = queriesMap.get(result[i].term).s;
    const queryAbstractable = queriesMap.get(result[i].term).a;
    originalTerms.push(result[i].term);
    let exactMatchBonus = 0;
    workingQueries.forEach((q) => {
      // eslint-disable-next-line eqeqeq
      if (result[i].term == q && q.includes(' ')) exactMatchBonus = 30;
    });

    // checking title
    if (result[i].relevant != null) {
      // there are terms with null relevant (title) because they have only abstract relevant (abstract)
      JSON.parse(result[i].relevant).forEach((e) => {
        const tempid = parseInt(e.p, 10);
        if (Number.isInteger(tempid)) {
          if (originalMultipliedRelevant.has(tempid)) {
            originalMultipliedRelevant.set(tempid,
              parseFloat(e.w) * queryWeight + originalMultipliedRelevant.get(tempid) + exactMatchBonus);
            scopesOfPubs.set(tempid, queryScope + ' ' + scopesOfPubs.get(tempid));
          } else {
            originalMultipliedRelevant.set(tempid, parseFloat(e.w) * queryWeight + exactMatchBonus);
            scopesOfPubs.set(tempid, queryScope);
          }
          if (scopesOfPubsTitle.has(tempid)) {
            scopesOfPubsTitle.set(tempid, queryScope + ' ' + scopesOfPubsTitle.get(tempid));
          } else {
            scopesOfPubsTitle.set(tempid, queryScope);
          }
        }
      });
    }

    // checking abstract
    if (result[i].relevant_abstract != null && queryAbstractable === true) {
      JSON.parse(result[i].relevant_abstract).forEach((e) => {
        const tempid = parseInt(e.p, 10);
        if (Number.isInteger(tempid)) {
          if (originalMultipliedRelevant.has(tempid)) {
            originalMultipliedRelevant.set(tempid,
              parseFloat(e.w) * queryWeight + originalMultipliedRelevant.get(tempid) + exactMatchBonus);
            scopesOfPubs.set(tempid, queryScope + ' ' + scopesOfPubs.get(tempid));
          } else {
            originalMultipliedRelevant.set(tempid, parseFloat(e.w) * queryWeight + exactMatchBonus);
            scopesOfPubs.set(tempid, queryScope);
          }
        }
      });
    }
  }

  // lowering weight of results without sufficient coverage IN ABSTRACT
  const numberOfImportantWords = relativeWeightModule.theNumberOfWords(workingQueries);
  const limitOfRelevancy = relativeWeightModule.theLimit(numberOfImportantWords, minRelevance);
  // const workingWords = workingQueries.join(' ').split(' ');
  const workingWords = [];
  workingQueries.forEach(q => workingWords.push(q.split(' ')));

  scopesOfPubs.forEach((scope, pub) => {
    let atLeastOneCovered = false;
    workingWords.forEach((one) => {
      let tempCov = 0;
      one.forEach((el) => {
        if (scope.includes(el)) tempCov += 1;
      });
      if (tempCov >= one.length) atLeastOneCovered = true;
    });
    if (!atLeastOneCovered) {
      let newOne = originalMultipliedRelevant.get(pub) * (1 / numberOfImportantWords);
      if (newOne > limitOfRelevancy) newOne = limitOfRelevancy - 2;
      originalMultipliedRelevant.set(pub, newOne);
    }
  });

  // giving more weight for results with 100% coverage IN TITLE
  scopesOfPubsTitle.forEach((scope, pub) => {
    let atLeastOneCovered = false;
    workingWords.forEach((one) => {
      let tempCov = 0;
      one.forEach((el) => {
        if (scope.includes(el)) tempCov += 1;
      });
      if (tempCov >= one.length) atLeastOneCovered = true;
    });
    if (atLeastOneCovered) {
      originalMultipliedRelevant.set(pub, originalMultipliedRelevant.get(pub) + 25);
    }
  });

  // deleting results with relevancy lower than 2/10
  const deleteLimit = relativeWeightModule.theLimit(numberOfImportantWords, 2);
  originalMultipliedRelevant.forEach((weight, pub) => {
    if (weight <= deleteLimit) {
      originalMultipliedRelevant.delete(pub);
    }
  });

  return { finalList: originalMultipliedRelevant, scopesTitle: scopesOfPubsTitle,
    scopesAll: scopesOfPubs, originalTerms };
};
