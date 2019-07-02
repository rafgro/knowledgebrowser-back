/* eslint-disable no-console */
const nlp = require('compromise');

exports.endThis = function (terms, today) {
  // initial preparation
  let allTerms = JSON.parse(terms[0].rawterms);
  allTerms = allTerms.map((value) => {
    // eslint-disable-next-line no-param-reassign
    value.s = parseInt(value.s, 10);
    return value;
  });
  allTerms.sort((a, b) => b.s - a.s);

  // crude but quick lingustic sanitization
  function disqualifyWords(v) {
    let ifTree = true;
    if (!v.t.includes(' ') && v.n > 5000) ifTree = false;
    else if (v.t.includes('we ')) ifTree = false;
    else if (v.t.includes(' we')) ifTree = false;
    else if (v.t.includes('our ')) ifTree = false;
    else if (v.t.includes(' our')) ifTree = false;
    else if (v.t.includes(' is')) ifTree = false;
    else if (v.t.includes('is ')) ifTree = false;
    else if (v.t === 'et al') ifTree = false;
    return ifTree;
  }
  allTerms = allTerms.filter(disqualifyWords);

  // nlp sanitization
  // console.log(nlp(allTerms[0].t).terms().data());

  logger.info(allTerms.slice(0, 50));
};
