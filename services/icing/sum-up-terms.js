/* eslint-disable no-console */
const nlp = require('compromise');

exports.endThis = function (sh, terms, today, type) {
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
    if (!v.t.includes(' ') && v.n > 3000) ifTree = false;
    else if (v.t.includes('we ')) ifTree = false;
    else if (v.t.includes(' we')) ifTree = false;
    else if (v.t.includes('our ')) ifTree = false;
    else if (v.t.includes(' our')) ifTree = false;
    else if (v.t.includes(' is')) ifTree = false;
    else if (v.t.includes('is ')) ifTree = false;
    else if (v.t === 'et al') ifTree = false;
    else if (v.t === 'state of the art') ifTree = false;
    else if (v.t.charAt(0) === ' ') ifTree = false;
    else if (v.t.charAt(v.t.length - 1) === ';') ifTree = false;
    return ifTree;
  }
  allTerms = allTerms.filter(disqualifyWords);
  allTerms = allTerms.slice(0, 1000);

  // merge similar terms
  function isSimilar(el, el2) {
    if (el.t === el2.t) return false; // failsafe
    let lengthFactor = el.t.length - el2.t.length;
    if (lengthFactor < 0) lengthFactor *= -1;
    if (lengthFactor <= 3) {
      if (el.t.includes(el2.t)) return true;
      if (el2.t.includes(el.t)) return true;
    }
    return false;
  }
  let mergedTerms = [];
  allTerms.forEach((el) => {
    const merged = [el];
    allTerms.forEach((el2) => {
      if (isSimilar(el, el2)) merged.push(el2);
    });
    merged.sort((a, b) => ((a.t > b.t) ? 1 : -1));
    mergedTerms.push({
      t: merged.map(e => e.t).join(', '),
      s: merged.reduce((acc, val) => val.s + acc, 0),
      n: Math.max(...(merged.map(e => e.n))),
    });
  });
  mergedTerms = mergedTerms.filter(function (a) {
    // eslint-disable-next-line no-return-assign
    return !this[a.t] && (this[a.t] = true);
  }, Object.create(null));
  mergedTerms.sort((a, b) => b.s - a.s);
  function chooseLongest(arr) {
    const arr2 = arr;
    arr2.sort((a, b) => b.length - a.length);
    return arr2[0];
  }
  mergedTerms = mergedTerms.map((value) => {
    // eslint-disable-next-line no-param-reassign
    value.c = chooseLongest(value.t.split(', '));
    return value;
  });

  // nlp sanitization
  // console.log(nlp(allTerms[0].t).terms().data());

  // final assembly
  mergedTerms = mergedTerms.slice(0, 15);
  mergedTerms.sort((a, b) => b.n - a.n);
  const assembled = [];
  for (let i = 0; i < 15; i += 1) {
    assembled.push({ t: mergedTerms[i].c, n: mergedTerms[i].n });
  }

  // saving to db
  sh.update('icing_stats').set('processedterms', '\'' + JSON.stringify(assembled) + '\'')
    .where('date', '=', today).and('type', '=', type)
    .run()
    .then(() => logger.info('Good, terms processed'))
    .catch(e => logger.error(e.toString()));
};
