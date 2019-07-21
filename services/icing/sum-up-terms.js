/* eslint-disable no-console */
// const nlp = require('compromise');

exports.endThis = function (sh, terms, today) {
  terms.forEach((onerow) => {
    // initial preparation
    let allTerms = JSON.parse(onerow.rawterms);
    allTerms = allTerms.map((value) => {
      // eslint-disable-next-line no-param-reassign
      value.s = parseInt(value.s, 10);
      return value;
    });
    allTerms.sort((a, b) => b.s - a.s);
    let highestN = allTerms[0].n;
    // console.log('Highest N for '+onerow.type+' is '+highestN);
    if (highestN < 5) highestN = 5;

    // crude but quick lingustic sanitization
    const listForPartialExclusion = ['et al', ' works', ' methods', ' are', 'it ', 'results', 'div>', 'p>'];
    const listForExactExclusion = ['high levels', 'orders of magnitude', 'lower bounds', 'proof of concept', 'trade off',
      'trade offs', 'based model', 'based models', 'amount of data', 'amounts of data', 'initial data', 'nature of',
      'this study', 'also', 'and', 'be', 'for', 'has', 'have', 'here', 'no', 'are', 'is', 'model', 'data', 'time',
      'over time', 'their', 'one', 'herein', 'different', 'method', 'long term', 'short run', 'order', 'methods',
      'can', 'been', 'high', 'process', 'model', 'models', 'end to end', 'one dimensional', 'non linear', 'time series',
      'proposed method', 'real world', 'two dimensional', 'type specific', 'large scale', 'real time', 'so called',
      'long range', 'time varying', 'long run', 'high dimensional', 'data driven', 'order of magnitude', 'recent years',
      'learning based', 'high quality', 'proposed model', 'data sets', 'steady state', 'short term', 'density functional',
      'room temperature', 'new avenues', 'end childhood', 'other outcomes', 'same time', 'randomized controlled',
      'global financial', 'three dimensional', 'higher order'];
    function disqualifyWords(v) {
      let ifTree = true;
      if (!v.t.includes(' ') && v.n > highestN) ifTree = false;
      else if (v.t.includes('we ')) ifTree = false;
      else if (v.t.includes(' we')) ifTree = false;
      else if (v.t.includes('our ')) ifTree = false;
      else if (v.t.includes(' our')) ifTree = false;
      else if (v.t.includes(' is')) ifTree = false;
      else if (v.t.includes('is ')) ifTree = false;
      else if (v.t.charAt(0) === ' ') ifTree = false;
      else if (v.t.charAt(v.t.length - 1) === ';') ifTree = false;
      listForPartialExclusion.forEach((el) => {
        if (v.t.includes(el)) ifTree = false;
      });
      listForExactExclusion.forEach((el) => {
        if (v.t === el) ifTree = false;
      });
      return ifTree;
    }
    allTerms = allTerms.filter(disqualifyWords);
    let topTwentyPercent = allTerms.length * 0.2;
    if (topTwentyPercent < 30) topTwentyPercent = 30;
    allTerms = allTerms.slice(0, topTwentyPercent);

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
      value.c = chooseLongest(value.t.split(', ')).replace('< sub>', '');
      return value;
    });

    // nlp sanitization
    // console.log(nlp(allTerms[0].t).terms().data());

    // final assembly
    mergedTerms = mergedTerms.slice(0, 25);
    mergedTerms.sort((a, b) => b.n - a.n);
    let assembled = [];
    for (let i = 0; i < 25; i += 1) {
      assembled.push({ t: mergedTerms[i].c, n: mergedTerms[i].n });
    }
    assembled = assembled.filter(function (a) {
      // eslint-disable-next-line no-return-assign
      return !this[a.t] && (this[a.t] = true);
    }, Object.create(null));


    // console.log(assembled);
    // saving to db
    sh.update('icing_stats').set('processedterms', '\'' + JSON.stringify(assembled) + '\'')
      .where('date', '=', today).and('type', '=', onerow.type)
      .run()
      .then(() => logger.info('Good, terms processed'))
      .catch(e => logger.error(e));
  });
};
