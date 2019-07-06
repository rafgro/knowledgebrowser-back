/* eslint-disable no-else-return */
/* eslint-disable no-param-reassign */
/* eslint-disable no-loop-func */
/* eslint-disable max-len */

const nlp = require('compromise');
const striptags = require('striptags');

// eslint-disable-next-line no-unused-vars
exports.doYourJob = function (sh, query, limit = 10, offset = 0, stats = 1, sortMode = 0) {
  return new Promise((resolve, reject) => {
    const hrstart = process.hrtime();

    // query sanitization
    if (offset < 0) offset = 0;
    // eslint-disable-next-line eqeqeq
    if (query == undefined) {
      reject({ message: 'Please enter your query.' });
    }
    if (query.length < 1 || query === ' ') {
      reject({ message: 'Please enter your query.' });
    }
    let workingQuery = query;
    if (query.length > 60) {
      workingQuery = workingQuery.substring(0, 60);
    }
    workingQuery = workingQuery
      .replace(/\'/g, '')
      .replace(/\:/g, ' ')
      .replace(/\;/g, ' ')
      .replace(/\"/g, '')
      .replace(/\//g, ' ')
      .replace(/\\/g, ' ')
      .replace(/\-/g, ' ')
      .replace(/\(/g, '')
      .replace(/\)/g, '');
    if (query.length < 1 || query === ' ') {
      reject({ message: 'Please enter your query.' });
    }

    // query processing
    const queryNlp = nlp(workingQuery);
    let queriesToDb = [];

    // onewordquery
    let oneword = true;
    if (workingQuery.includes(' ')) oneword = false;

    /* q: query to database,
       w: weight of this query,
       s: scope of coverage of original query,
       a: true if look in abstract */

    // working on specific words
    const words = queryNlp.terms().data();
    // console.log(JSON.stringify(words));
    // reject(words);

    function populateNounToForms(noun) {
      const lastCase = noun.charAt(noun.length - 1);
      let processedNoun = noun;
      const toReturn = [];
      if (lastCase !== 's') {
        toReturn.push(processedNoun + 's');
      }
      if (
        lastCase === 'e'
        || lastCase === 'y'
        || lastCase === 'i'
        || lastCase === 'o'
        || lastCase === 'a'
      ) {
        processedNoun = noun.substring(0, noun.length - 1);
      } else if (lastCase === 's' && noun.charAt(noun.length - 2) === 'c') {
        toReturn.push(processedNoun);
        processedNoun = noun.substring(0, noun.length - 2);
      } else if (
        lastCase === 'n'
        && noun.charAt(noun.length - 2) === 'o'
        && noun.charAt(noun.length - 3) === 'i'
      ) {
        // expression, evolution -> express, evolut
        processedNoun = noun.substring(0, noun.length - 3);
      } else if (lastCase === 'm' && noun.charAt(noun.length - 2) === 's') {
        // autism -> autist
        processedNoun = noun.substring(0, noun.length - 1) + 't';
      }
      toReturn.push(processedNoun + 'ed');
      toReturn.push(processedNoun + 'ely');
      toReturn.push(processedNoun + 'ary');
      toReturn.push(processedNoun + 'ory');
      toReturn.push(processedNoun + 'ic');
      toReturn.push(processedNoun + 'al');
      toReturn.push(processedNoun + 'ial');
      toReturn.push(processedNoun + 'ical');
      toReturn.push(processedNoun + 'ous');
      toReturn.push(processedNoun + 'ational');
      toReturn.push(processedNoun + 'ation');
      if (noun.includes('ity')) { toReturn.push(noun.substring(0, noun.length - 3)); }
      if (noun.includes('al')) { toReturn.push(noun.substring(0, noun.length - 2)); }
      return toReturn;
    }

    function populateVerbToForms(verb) {
      const lastCase = verb.charAt(verb.length - 1);
      const toReturn = [];
      if (lastCase === 's') {
        // waves, creates, regulates
        toReturn.push(verb.substring(0, verb.length - 1));
        toReturn.push(verb.substring(0, verb.length - 1) + 'd');
        toReturn.push(verb.substring(0, verb.length - 2) + 'ion');
        toReturn.push(verb.substring(0, verb.length - 2) + 'ing');
        toReturn.push(verb.substring(0, verb.length - 2) + 'ory');
      }
      if (lastCase === 'e') {
        // drive -> drives, drived, driving, drivion
        toReturn.push(verb + 's');
        toReturn.push(verb + 'd');
        toReturn.push(verb.substring(0, verb.length - 1) + 'ing');
      } else if (lastCase === 'g') {
        // expressing -> expresses, expressed, expression
        // sequencing -> sequences, sequenced
        const withoutIng = verb.substring(0, verb.length - 3);
        toReturn.push(withoutIng + 'es');
        toReturn.push(withoutIng + 'ed');
        toReturn.push(withoutIng + 'ion');
      }
      return toReturn;
    }

    // pairs with nouns: adjectives, verbs, acronyms, other nouns
    const checkIfNoun = word => word === 'Noun';
    const checkIfAdjective = word => word === 'Adjective' || word === 'Comparable';
    const checkIfAcronym = word => word === 'Acronym';
    const checkIfValue = word => word === 'Value';
    const checkIfVerb = word => word === 'Verb';
    const checkIfPreposition = word => word === 'Preposition';
    let numberOfImportantWords = 0;
    if (oneword === false) {
      for (let i = 0; i < words.length; i += 1) {
        if (
          words[i].tags.find(checkIfNoun)
          || words[i].tags.find(checkIfAdjective)
          || words[i].tags.find(checkIfAcronym)
          || words[i].tags.find(checkIfValue)
          || words[i].tags.find(checkIfVerb)
          || words[i].tags.find(checkIfPreposition)
        ) {
          numberOfImportantWords += 1;
        }

        if (words[i].tags.find(checkIfNoun)) {
          if (i > 0) {
            let weight = 0;
            if (words[i - 1].tags.find(checkIfAdjective)) {
              weight = 9.5;
            } else if (words[i - 1].tags.find(checkIfVerb)) {
              weight = 9;
            } else if (words[i - 1].tags.find(checkIfAcronym)) {
              weight = 8;
            } else if (words[i - 1].tags.find(checkIfValue)) {
              weight = 7;
            } else if (words[i - 1].tags.find(checkIfNoun)) {
              weight = 9.5;
            }

            if (weight > 0) {
              // the second word is noun

              queriesToDb.push({
                q: words[i - 1].normal + ' ' + words[i].normal,
                w: weight,
                s: words[i - 1].text + ' ' + words[i].text,
                a: true,
              });
              if (words[i].normal.charAt(words[i].normal.length - 1) !== 's') {
                queriesToDb.push({
                  q: words[i - 1].normal + ' ' + words[i].normal + 's',
                  w: weight,
                  s: words[i - 1].text + ' ' + words[i].text,
                  a: true,
                });
              } else {
                queriesToDb.push({
                  q:
                    words[i - 1].normal
                    + ' '
                    + words[i].normal.substring(0, words[i].normal.length - 1),
                  w: weight,
                  s: words[i - 1].text + ' ' + words[i].text,
                  a: true,
                });
              }
              if (
                words[i - 1].normal.charAt(words[i - 1].normal.length - 1)
                !== 's'
              ) {
                queriesToDb.push({
                  q: words[i - 1].normal + 's ' + words[i].normal,
                  w: weight,
                  s: words[i - 1].text + ' ' + words[i].text,
                  a: true,
                });
              } else {
                queriesToDb.push({
                  q:
                    words[i - 1].normal.substring(0, words[i - 1].normal - 1)
                    + ' '
                    + words[i].normal,
                  w: weight,
                  s: words[i - 1].text + ' ' + words[i].text,
                  a: true,
                });
              }
              populateNounToForms(words[i].normal).forEach(e => queriesToDb.push({
                q: words[i - 1].normal + ' ' + e,
                w: weight,
                s: words[i - 1].text + ' ' + words[i].text,
                a: true,
              }));

              if (words[i - 1].tags.find(checkIfVerb)) {
                populateVerbToForms(words[i - 1].normal).forEach(e => queriesToDb.push({
                  q: e + ' ' + words[i].normal,
                  w: weight,
                  s: words[i - 1].text + ' ' + words[i].text,
                  a: true,
                }));
              }
            }
          }
          if (i + 1 < words.length) {
            let weight = 0;
            if (words[i + 1].tags.find(checkIfAdjective)) {
              weight = 9.5;
            } else if (words[i + 1].tags.find(checkIfVerb)) {
              weight = 9;
            } else if (words[i + 1].tags.find(checkIfAcronym)) {
              weight = 8;
            } else if (words[i + 1].tags.find(checkIfValue)) {
              weight = 7;
            } else if (words[i + 1].tags.find(checkIfNoun)) {
              weight = 9.5;
            }

            if (weight > 0) {
              // the first word is noun

              queriesToDb.push({
                q: words[i].normal + ' ' + words[i + 1].normal,
                w: weight,
                s: words[i].text + ' ' + words[i + 1].text,
                a: true,
              });
              if (words[i].normal.charAt(words[i].normal.length - 1) !== 's') {
                queriesToDb.push({
                  q: words[i].normal + 's ' + words[i + 1].normal,
                  w: weight,
                  s: words[i].text + ' ' + words[i + 1].text,
                  a: true,
                });
              } else {
                queriesToDb.push({
                  q:
                    words[i].normal.substring(0, words[i].normal.length - 1)
                    + ' '
                    + words[i + 1].normal,
                  w: weight,
                  s: words[i].text + ' ' + words[i + 1].text,
                  a: true,
                });
              }
              if (
                words[i + 1].normal.charAt(words[i + 1].normal.length - 1)
                !== 's'
              ) {
                queriesToDb.push({
                  q: words[i].normal + ' ' + words[i + 1].normal + 's',
                  w: weight,
                  s: words[i].text + ' ' + words[i + 1].text,
                  a: true,
                });
              } else {
                queriesToDb.push({
                  q:
                    words[i].normal
                    + ' '
                    + words[i + 1].normal.substring(
                      0,
                      words[i + 1].normal.length - 1,
                    ),
                  w: weight,
                  s: words[i].text + ' ' + words[i + 1].text,
                  a: true,
                });
              }
              populateNounToForms(words[i].normal).forEach(e => queriesToDb.push({
                q: e + ' ' + words[i + 1].normal,
                w: weight,
                s: words[i].text + ' ' + words[i + 1].text,
                a: true,
              }));

              if (words[i + 1].tags.find(checkIfVerb)) {
                populateVerbToForms(words[i + 1].normal).forEach(e => queriesToDb.push({
                  q: words[i].normal + ' ' + e,
                  w: weight,
                  s: words[i].text + ' ' + words[i + 1].text,
                  a: true,
                }));
              }
            }
          }
        }
      }
    }
    if (numberOfImportantWords === 0) numberOfImportantWords = 1;

    // single words
    words.forEach((word) => {
      // eslint-disable-next-line no-empty
      if (
        word.normal === 'on'
        || word.normal === 'of'
        || word.normal === 'in'
      ) {
        // no action
      } else if (word.tags.find(checkIfNoun)) {
        queriesToDb.push({
          q: word.normal,
          w: 4,
          s: word.text,
          a: true,
        });
        populateNounToForms(word.normal).forEach(e => queriesToDb.push({
          q: e,
          w: 4,
          s: word.text,
          a: true,
        }));
        // queriesToDb.push( { q: nlp(word.normal).nouns().toSingular().all().normalize().out(), w: 3, s: word.text, a: true } );
        // queriesToDb.push( { q: nlp(word.normal).nouns().toPlural().all().normalize().out(), w: 3, s: word.text, a: true } );
      } else if (word.tags.find(checkIfVerb)) {
        queriesToDb.push({
          q: word.normal,
          w: 4,
          s: word.text,
          a: true,
        });
        populateVerbToForms(word.normal).forEach(e => queriesToDb.push({
          q: e,
          w: 3,
          s: word.text,
          a: true,
        }));
      } else if (word.tags.find(checkIfAdjective)) {
        queriesToDb.push({ q: word.normal, w: 3, s: word.text });
        populateNounToForms(word.normal).forEach(e => queriesToDb.push({
          q: e,
          w: 2,
          s: word.text,
          a: false,
        }));
      } else if (word.tags.find(checkIfValue)) {
        queriesToDb.push({
          q: word.normal,
          w: 1,
          s: word.text,
          a: false,
        });
      } else {
        queriesToDb.push({
          q: word.normal,
          w: 1,
          s: word.text,
          a: true,
        });
      }
    });

    // different forms are of lower weight when less words
    const lowerWeight = 10;

    // three initial ways: original query, singular query, plural query
    queriesToDb.unshift({
      q: queryNlp
        .normalize()
        .toLowerCase()
        .out(),
      w: 10,
      s: workingQuery,
      a: true,
    });
    queriesToDb.unshift({
      q: queryNlp
        .nouns()
        .toSingular()
        .all()
        .normalize()
        .toLowerCase()
        .out(),
      w: lowerWeight,
      s: workingQuery,
      a: true,
    });
    queriesToDb.unshift({
      q: queryNlp
        .nouns()
        .toPlural()
        .all()
        .normalize()
        .toLowerCase()
        .out(),
      w: lowerWeight,
      s: workingQuery,
      a: true,
    });

    // deleting duplications
    queriesToDb = queriesToDb.filter(function (a) {
      // eslint-disable-next-line no-return-assign
      return !this[a.q] && (this[a.q] = true);
    }, Object.create(null));
    const queriesMap = new Map();
    queriesToDb.forEach((e) => {
      queriesMap.set(e.q, { w: e.w, s: e.s, a: e.a });
    });
    // reject(queriesToDb);

    // database querying

    sh.select('term', 'relevant', 'relevant_abstract')
      .from('index_title')
      .where('term', 'IN', "('" + queriesToDb.map(e => e.q).join("', '") + "')")
      .run()
      .then((result) => {
        // assembling and returning the results

        if (Object.keys(result).length !== 0) {
          const originalTerms = []; // for adding strong around words
          // assemble all variants the results, multipliying base weights by relevancy weights
          // let multipliedRelevant = new Array();
          const originalMultipliedRelevant = new Map();
          const scopesOfPubsTitle = new Map();
          const scopesOfPubs = new Map();
          for (let i = 0; i < result.length; i += 1) {
            /* let queryWeight = queriesToDb.find( function(e) {
                        return e.q == result[i].term;
                    }).w;
                    let queryScope = queriesToDb.find( function(e) {
                        return e.q == result[i].term;
                    }).s; */
            const queryWeight = queriesMap.get(result[i].term).w;
            const queryScope = queriesMap.get(result[i].term).s;
            const queryAbstractable = queriesMap.get(result[i].term).a;
            originalTerms.push(result[i].term);
            if (result[i].relevant != null) {
              // there are terms with null relevant (title) because they have only abstract relevant (abstract)
              JSON.parse(result[i].relevant).forEach((e) => {
                const tempid = parseInt(e.p, 10);
                if (Number.isInteger(tempid)) {
                  if (originalMultipliedRelevant.has(tempid)) {
                    originalMultipliedRelevant.set(
                      tempid,
                      parseFloat(e.w) * queryWeight
                        + originalMultipliedRelevant.get(tempid),
                    );
                    scopesOfPubs.set(
                      tempid,
                      queryScope + ' ' + scopesOfPubs.get(tempid),
                    );
                  } else {
                    originalMultipliedRelevant.set(
                      tempid,
                      parseFloat(e.w) * queryWeight,
                    );
                    scopesOfPubs.set(tempid, queryScope);
                  }
                  if (scopesOfPubsTitle.has(tempid)) {
                    scopesOfPubsTitle.set(
                      tempid,
                      queryScope + ' ' + scopesOfPubsTitle.get(tempid),
                    );
                  } else {
                    scopesOfPubsTitle.set(tempid, queryScope);
                  }
                }
              });
            }
            if (
              result[i].relevant_abstract != null
              && queryAbstractable === true
            ) {
              JSON.parse(result[i].relevant_abstract).forEach((e) => {
                const tempid = parseInt(e.p, 10);
                if (Number.isInteger(tempid)) {
                  if (originalMultipliedRelevant.has(tempid)) {
                    originalMultipliedRelevant.set(
                      tempid,
                      parseFloat(e.w) * queryWeight
                        + originalMultipliedRelevant.get(tempid),
                    );
                    scopesOfPubs.set(
                      tempid,
                      queryScope + ' ' + scopesOfPubs.get(tempid),
                    );
                  } else {
                    originalMultipliedRelevant.set(
                      tempid,
                      parseFloat(e.w) * queryWeight,
                    );
                    scopesOfPubs.set(tempid, queryScope);
                  }
                }
              });
            }
          }

          /* let multipliedRelevant = new Array();
                for( let i = 0; i < result.length; i++ ) {
                    let queryWeight = queriesToDb.find( function(e) {
                        return e.q == result[i].term;
                    }).w;
                    let queryScope = queriesToDb.find( function(e) {
                        return e.q == result[i].term;
                    }).s;
                    originalTerms.push(result[i].term);
                    if( result[i].relevant != null ) {
                        //there are terms with null relevant (title) because they have only abstract relevant (abstract)
                        JSON.parse( result[i].relevant_abstract ).forEach( e => {
                            multipliedRelevant.push( { p: parseInt(e.p), w: parseFloat(e.w) * queryWeight, s: queryScope } );
                        });
                    }
                    if( result[i].relevant_abstract != null ) {
                        JSON.parse( result[i].relevant_abstract ).forEach( e => {
                            multipliedRelevant.push( { p: parseInt(e.p), w: parseFloat(e.w) * queryWeight, s: queryScope });
                        });
                    }
                }

                //adding weights of repeated pubs
                let originalMultipliedRelevant = new Map();
                let scopesOfPubs = new Map();
                for( let i = 0; i < multipliedRelevant.length; i++ ) {
                    if( originalMultipliedRelevant.has( multipliedRelevant[i].p ) ) {
                        originalMultipliedRelevant.set( multipliedRelevant[i].p,
                            multipliedRelevant[i].w + originalMultipliedRelevant.get(multipliedRelevant[i].p) );
                        scopesOfPubs.set( multipliedRelevant[i].p,
                            multipliedRelevant[i].s + ' ' + scopesOfPubs.get(multipliedRelevant[i].p) );
                    } else {
                        originalMultipliedRelevant.set( multipliedRelevant[i].p, multipliedRelevant[i].w );
                        scopesOfPubs.set( multipliedRelevant[i].p, multipliedRelevant[i].s );
                    }
                } */

          const limitOfRelevancy = whatsTheLimit(numberOfImportantWords);

          // correcting weight of pubs without sufficient coverage
          const workingWords = workingQuery.split(' ');
          scopesOfPubs.forEach((scope, pub) => {
            let tempCov = 0;
            workingWords.forEach((el) => {
              if (scope.includes(el)) tempCov += 1;
            });
            if (tempCov < workingWords.length) {
              let newOne = originalMultipliedRelevant.get(pub)
                * (1 / numberOfImportantWords);
              if (newOne > limitOfRelevancy) newOne = limitOfRelevancy - 2;
              originalMultipliedRelevant.set(pub, newOne);
            }
          });
          scopesOfPubsTitle.forEach((scope, pub) => {
            let tempCov = 0;
            workingWords.forEach((el) => {
              if (scope.includes(el)) tempCov += 1;
            });
            if (tempCov >= workingWords.length) {
              originalMultipliedRelevant.set(
                pub,
                originalMultipliedRelevant.get(pub) + 25,
              );
            }
          });
          // reject( { scope: scopesOfPubs.get() } )


          const arrayOfQueries = [];
          let howManyRelevant = 0;

          /* Sorting relevant by DATE */
          // eslint-disable-next-line eqeqeq
          if (sortMode == 0) {
            // idea: node is stalling during mapping results to weights when there are thousands of them,
            // so we need to pass to node only the last step of processing,
            // so we can: 1. divide pubs to two arrays - relevant and low relevancy (just one foreach!)
            // then: 2. ask for them in two queries BUT leave sorting by date and limiting for faster postgres
            // then: 3. merge both queries and map only that part that will be sent by api
            // maybe three arrays: relevant, grey area (3-2/10) and then unrelevant (1/10)

            // 1
            const moreRelevantIds = [];
            const lessRelevantIds = [];
            originalMultipliedRelevant.forEach((pubWeight, pubId) => {
              // final division
              if (pubWeight > limitOfRelevancy) { moreRelevantIds.push({ p: pubId, w: pubWeight }); } else lessRelevantIds.push({ p: pubId, w: pubWeight });
            });
            howManyRelevant = moreRelevantIds.length;

            // 2
            let moreRelevantNeeded = false;
            let moreRelevantOffset = 0;
            let moreRelevantLimit = 0;
            let lessRelevantNeeded = false;
            let lessRelevantOffset = 0;
            // let lessRelevantLimit = 0;

            const offsetAsNumber = parseInt(offset, 10);
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
                  .limit(moreRelevantLimit, moreRelevantOffset)
                  .run(),
              );
            }
            if (lessRelevantNeeded) {
              // dividing to more and less relevant one step further
              const furtherHigher = [];
              const furtherLower = [];
              const boundary = limitOfRelevancy * 0.8;
              lessRelevantIds.forEach((element) => {
                if (element.w > boundary) { furtherHigher.push({ p: element.p, w: element.w }); } else furtherLower.push({ p: element.p, w: element.w });
              });

              // taking all from higher boundary first
              if (lessRelevantOffset + 10 < furtherHigher.length) {
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
                    .limit(10, lessRelevantOffset)
                    .run(),
                );
              } else if (
                lessRelevantOffset + 10 > furtherHigher.length
                && lessRelevantOffset < furtherHigher.length
              ) {
                // taking from both sides
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
                    .limit(10, lessRelevantOffset)
                    .run(),
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
                    .limit(10, 0)
                    .run(),
                );
              } else {
                // taking from lower boundary if we are past higher
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
                    .limit(10, lessRelevantOffset - furtherHigher.length) // lessRelevantOffset-furtherHigher.length)
                    .run(),
                );
                // reject( {less: lessRelevantOffset, highLen: furtherHigher.length, lowLen: furtherLower.length} );
              }
            }
          // eslint-disable-next-line brace-style
          }
          /* Sorting relevant by RELEVANCY */
          else {
            // idea: provide slice of ten from the most relevant pubs

            const sortedByWeight = [];
            originalMultipliedRelevant.forEach((pubWeight, pubId) => {
              sortedByWeight.push({ p: pubId, w: pubWeight });
            });

            sortedByWeight.sort((a, b) => b.w - a.w);
            const offsetAsNumber = parseInt(offset, 10);

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
            // reject(primaryQuery.build());
            arrayOfQueries.push(primaryQuery.run());
          }

          // 3
          Promise.all(arrayOfQueries)
            .then((arrayOfResults) => {
              let properArray = [];
              if (arrayOfQueries.length === 3) {
                properArray = arrayOfResults[0].concat(
                  arrayOfResults[1],
                  arrayOfResults[2],
                );
              } else if (arrayOfQueries.length === 2) {
                properArray = arrayOfResults[0].concat(arrayOfResults[1]);
              } else {
                // eslint-disable-next-line prefer-destructuring
                properArray = arrayOfResults[0];
              }

              if (properArray.length > 10) { properArray = properArray.slice(0, 10); }
              if (properArray[0] === undefined) {
                reject({
                  message:
                    'Sorry, there are no more results for <i>' + query + '</i>.',
                });
              }

              function strongifyTitle(text, listToStrong) {
                let tempText = text;
                listToStrong.forEach((word) => {
                  let toAdd = 0;
                  const lower = tempText.toLowerCase();
                  let pos1 = lower.indexOf('g> ' + word + ' ');
                  toAdd = 3;
                  if (pos1 === -1) {
                    pos1 = lower.indexOf(' ' + word + ' <s');
                    toAdd = 1;
                  }
                  if (pos1 === -1) {
                    pos1 = lower.indexOf(' ' + word + ' ');
                    toAdd = 1;
                  }
                  if (pos1 === -1) {
                    pos1 = lower.indexOf('-' + word + ' ');
                    toAdd = 1;
                  }
                  if (pos1 === -1) {
                    pos1 = lower.indexOf(' ' + word + '-');
                    toAdd = 1;
                  }
                  if (pos1 === -1) {
                    pos1 = lower.indexOf(word + ' ');
                    toAdd = 0;
                  }
                  if (pos1 === -1) {
                    pos1 = lower.indexOf(' ' + word + '.');
                    toAdd = 1;
                  }
                  /* if (pos1 === -1) {
                    pos1 = lower.indexOf(word);
                    toAdd = 0;
                  } */
                  if (pos1 !== -1) {
                    let can = true;
                    pos1 += toAdd;
                    if (pos1 > 0) {
                      can = false;
                      if (tempText.charAt(pos1 - 1) !== '>') {
                        can = true;
                      }
                    }
                    if (can) {
                      tempText = tempText.substring(0, pos1)
                        + '<strong>'
                        + tempText.substring(pos1, pos1 + word.length)
                        + '</strong>'
                        + tempText.substring(pos1 + word.length);
                    }
                  }
                });
                return tempText;
              }

              function strongifyAbstract(text, listToStrong) {
                const sentences = text
                  .replace(/([.?])\s*(?=[A-Z])/g, '$1|')
                  .split('|');
                let highestScore = 0;
                let highestWhich = sentences[0];
                if (highestWhich.length < 50) { highestWhich = sentences[0] + ' ' + sentences[1]; }
                if (text.includes('$')) {
                  return highestWhich;
                } // quickfix to not fuck up latex
                sentences.forEach((sentence) => {
                  let score = 0;
                  listToStrong.forEach((word) => {
                    if (sentence.toLowerCase().includes(word)) score += 1;
                  });
                  if (score >= highestScore) {
                    highestScore = score;
                    highestWhich = sentence;
                  }
                });
                let tempText = highestWhich;
                listToStrong.forEach((word) => {
                  let toAdd = 0;
                  const lower = tempText.toLowerCase();
                  let pos1 = lower.indexOf('g> ' + word + ' ');
                  toAdd = 3;
                  if (pos1 === -1) {
                    pos1 = lower.indexOf(' ' + word + ' <s');
                    toAdd = 1;
                  }
                  if (pos1 === -1) {
                    pos1 = lower.indexOf(' ' + word + ' ');
                    toAdd = 1;
                  }
                  if (pos1 === -1) {
                    pos1 = lower.indexOf('-' + word + ' ');
                    toAdd = 1;
                  }
                  if (pos1 === -1) {
                    pos1 = lower.indexOf(' ' + word + '-');
                    toAdd = 1;
                  }
                  if (pos1 === -1) {
                    pos1 = lower.indexOf(word + ' ');
                    toAdd = 0;
                  }
                  if (pos1 === -1) {
                    pos1 = lower.indexOf(' ' + word + '.');
                    toAdd = 1;
                  }
                  /* if (pos1 === -1) {
                    pos1 = lower.indexOf(word);
                    toAdd = 0;
                  } */
                  if (pos1 !== -1) {
                    let can = true;
                    pos1 += toAdd;
                    if (pos1 > 0) {
                      can = false;
                      if (tempText.charAt(pos1 - 1) !== '>') {
                        can = true;
                      }
                    }
                    if (can) {
                      tempText = tempText.substring(0, pos1)
                        + '<strong>'
                        + tempText.substring(pos1, pos1 + word.length)
                        + '</strong>'
                        + tempText.substring(pos1 + word.length);
                    }
                  }
                });
                return tempText;
              }

              function strongifyAbstractFull(text, listToStrong) {
                // eslint-disable-next-line prefer-const
                let tempText = text;
                listToStrong.forEach((word) => {
                  tempText = tempText.replace(RegExp(`\\-(${word}) `, 'gi'), '-<strong>$1</strong> ');
                  tempText = tempText.replace(RegExp(` (${word})\\-`, 'gi'), ' <strong>$1</strong>-');
                  tempText = tempText.replace(RegExp(` (${word})\\.`, 'gi'), ' <strong>$1</strong>.');
                  tempText = tempText.replace(RegExp(` (${word}) `, 'gi'), ' <strong>$1</strong> ');
                });
                return tempText;
              }

              function correctScreamingTitle(whatTitle) {
                let tempTitle = whatTitle;
                const numLow = tempTitle.replace(/[A-Z]/g, '').toString()
                  .length;
                if (numLow < 30) {
                  tempTitle = tempTitle.charAt(0) + tempTitle.substring(1).toLowerCase();
                }
                return tempTitle;
              }

              const listOfWords = originalTerms
                .join(' ')
                .split(' ')
                .filter((v, i, s) => s.indexOf(v) === i);
              listOfWords.sort((a, b) => {
                if (a.length > b.length) return -1;
                if (a.length < b.length) return 1;
                return 0;
              }); // quickfix to avoid double stronging plurals (like signal and signals)

              const highestRelevancy = 0;
              const newestResult = new Date(properArray[0].date).getTime();
              const publications = properArray.map((value) => {
                const untitle = correctScreamingTitle(
                  unescape(value.title)
                    .replace(RegExp('\\. \\(arXiv:.*\\)'), '')
                    .replace(/\\'/, "'"),
                );
                value.title = strongifyTitle(untitle, listOfWords).replace(
                  /\<\/\d\i\v\>/g,
                  '',
                );
                value.authors = unescape(value.authors);
                if (value.abstract.length > 5) {
                  const unabstract = striptags(
                    unescape(value.abstract)
                      .replace(/\r?\n|\r/g, ' ')
                      .replace(/\<\/\d\i\v\>/g, '')
                      .toString(),
                  );
                  value.abstract = strongifyAbstract(unabstract, listOfWords);
                  value.abstractFull = strongifyAbstractFull(unabstract, listOfWords);
                }
                if (value.abstract.length > 360) {
                  const where = value.abstract.indexOf(' ', 350);
                  if (where > -1) { value.abstract = value.abstract.substring(0, where) + '...'; }
                }
                value.weight = originalMultipliedRelevant.get(
                  parseInt(value.id, 10),
                );
                value.relativeWeight = calculateRelativeWeight(
                  value.weight,
                  numberOfImportantWords,
                );
                // value.debug = verifyQueryCoverage( pubVsTitleTerm[parseInt(value.id)], pubVsAbstractTerm[parseInt(value.id)] );
                return value;
              });

              // eslint-disable-next-line eqeqeq
              if (parseInt(offset, 10) == 0 && stats == 1) {
                let quality = 0;
                quality = publications[0].relativeWeight / 2;
                if (publications.length >= 5) { quality += publications[4].relativeWeight / 4; }
                if (publications.length >= 10) { quality += publications[9].relativeWeight / 4; }

                const hrend = process.hrtime(hrstart);

                const details = '{"timestamp":"'
                  + Date.now()
                  + '","howManyRelevant":"'
                  + howManyRelevant
                  + '","highestRelevancy":"'
                  + highestRelevancy
                  + '","executionTime":"'
                  + (hrend[1] / 1000000 + hrend[0] * 1000).toFixed(0)
                  + '","newestResult":"'
                  + newestResult.toFixed(0)
                  + '"}';
                registerQueryInStats(
                  sh,
                  workingQuery,
                  quality.toFixed(0),
                  details,
                  parseInt(
                    (hrend[1] / 1000000 + hrend[0] * 1000).toFixed(0),
                    10,
                  ),
                );
              }

              resolve({
                numberofall: originalMultipliedRelevant.size,
                results: publications,
              });
            })
            .catch((e) => {
              registerQueryInStats(
                sh,
                workingQuery,
                '0',
                '{"timestamp":"'
                  + Date.now()
                  + '","error":"'
                  + escape(e.toString())
                  + '"}',
              );
              logger.error('line 1194');
              logger.error(JSON.stringify(e));
              reject({ message: 'Sorry, we have encountered an error.' });
            });
        } else {
          registerQueryInStats(
            sh,
            workingQuery,
            '0',
            '{"timestamp":"' + Date.now() + '","error":"no results"}',
          );
          logger.error('line 1217');
          logger.error('no results for ' + query);
          reject({
            message:
              'Sorry, there are no results for <i>'
              + query
              + '</i>. Would you like to rephrase your query?',
          });
        }
      })
      .catch((e) => {
        registerQueryInStats(
          sh,
          workingQuery,
          '0',
          '{"timestamp":"'
            + Date.now()
            + '","error":"'
            + escape(e.toString())
            + '"}',
        );
        logger.error('line 1238');
        logger.error(JSON.stringify(
          sh
            .select('term', 'relevant', 'relevant_abstract')
            .from('index_title')
            .where('term', 'IN', "('" + queriesToDb.map(es => es.q).join("', '") + "')")
            .build(),
        ));
        logger.error(JSON.stringify(e));
        reject({ message: 'Sorry, we have encountered an error.' });
      });
  });
};

function registerQueryInStats(
  sh,
  query,
  lastQuality,
  newDetails,
  lastExecTime,
) {
  sh.insert({
    query,
    lastquality: lastQuality,
    details: "\'[" + newDetails + "]\'",
    lastexectime: lastExecTime,
  })
    .into('query_stats')
    .run()
    .then(() => {
      logger.info(`Logged query ${query}`);
    })
    .catch((e) => {
      logger.error('line 1271');
      logger.error(JSON.stringify(
        sh.insert({
          query,
          lastquality: lastQuality,
          details: "\'[" + newDetails + "]\'",
          lastexectime: lastExecTime,
        })
          .into('query_stats')
          .build(),
      ));
      logger.error(JSON.stringify(e));
    });

  // changed to record every query in a new record

  /* sh.select('details').from('query_stats')
        .where('query','=',escape(query)).run()
        .then(result => {

            if( result.length == 0 ) {

                sh.insert({
                    query: escape(query),
                    lastquality: lastQuality,
                    details: '\'['+newDetails+']\'',
                    lastexectime: lastExecTime })
                .into('query_stats')
                .run()
                .then(() => {
                    //console.log('ok');
                })
                .catch(e => {
                    console.log(e);
                });

            } else {

                sh.update('query_stats')
                .set({
                  lastquality: lastQuality,
                  details: '\''+result[0].details.substring(0,result[0].details.length-1)+","+newDetails+']\'',
                  lastexectime: lastExecTime })
                .where('query','=',escape(query))
                .run()
                .then(() => {
                    //console.log('ok');
                })
                .catch(e => {
                    console.log(e);
                });

            }

    })
    .catch(e=>{
        logger.info("error during query stats insertion");
    }); */
}

function calculateRelativeWeight(originalWeight, noOfWords) {
  switch (noOfWords) {
    case 1:
      if (originalWeight > 125) return 9;
      else if (originalWeight > 115) return 8;
      else if (originalWeight > 90) return 7;
      else if (originalWeight > 70) return 6;
      else if (originalWeight > 50) return 5;
      else if (originalWeight > 25) return 4;
      else if (originalWeight > 12) return 3;
      else if (originalWeight > 7) return 2;
      else {
        return 1;
      }
    case 2:
      if (originalWeight > 190) return 10;
      else if (originalWeight > 170) return 9;
      else if (originalWeight > 145) return 8;
      else if (originalWeight > 110) return 7;
      else if (originalWeight > 105) return 6;
      else if (originalWeight > 90) return 5;
      else if (originalWeight > 65) return 4;
      else if (originalWeight > 35) return 3;
      else if (originalWeight > 20) return 2;
      else {
        return 1;
      }
    case 3:
      if (originalWeight > 170) return 10;
      else if (originalWeight > 120) return 9;
      else if (originalWeight > 115) return 8;
      else if (originalWeight > 110) return 7;
      else if (originalWeight > 100) return 6;
      else if (originalWeight > 90) return 5;
      else if (originalWeight > 84) return 4;
      else if (originalWeight > 60) return 3;
      else if (originalWeight > 40) return 2;
      else {
        return 1;
      }
    case 4:
      if (originalWeight > 150) return 10;
      if (originalWeight > 130) return 9;
      if (originalWeight > 120) return 8;
      if (originalWeight > 110) return 7;
      if (originalWeight > 100) return 6;
      else if (originalWeight > 90) return 5;
      else if (originalWeight > 84) return 4;
      else if (originalWeight > 65) return 3;
      else if (originalWeight > 50) return 2;
      else {
        return 1;
      }
    default:
      if (originalWeight > 160 + (noOfWords - 4) * 10) return 10;
      else if (originalWeight > 140 + (noOfWords - 4) * 10) return 9;
      else if (originalWeight > 130 + (noOfWords - 4) * 10) return 8;
      else if (originalWeight > 120 + (noOfWords - 4) * 10) return 7;
      else if (originalWeight > 110 + (noOfWords - 4) * 10) return 6;
      else if (originalWeight > 100 + (noOfWords - 4) * 10) return 5;
      else if (originalWeight > 90 + (noOfWords - 4) * 10) return 4;
      else if (originalWeight > 65 + (noOfWords - 4) * 10) return 3;
      else if (originalWeight > 50 + (noOfWords - 4) * 10) return 2;
      else {
        return 1;
      }
  }
}

function whatsTheLimit(noOfWords) {
  switch (noOfWords) {
    case 1:
      return 25;
    case 2:
      return 65;
    case 3:
      return 84;
    case 4:
      return 84;
    default:
      return 90 + (noOfWords - 4) * 10;
  }
}
