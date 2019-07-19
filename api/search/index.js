/* eslint-disable no-else-return */
/* eslint-disable no-param-reassign */
/* eslint-disable no-loop-func */
/* eslint-disable max-len */
/* eslint-disable eqeqeq */

const querySanitization = require('./query-sanitization');
const nlpProcessQuery = require('./nlp-process-query');
const assembleResults = require('./assemble-results');
const relativeWeightModule = require('./relative-weights');
const strategyNotifications = require('./strategy-notifications');
const strategyDefaultbydate = require('./strategy-defaultbydate');
const strategyOptionalbyrel = require('./strategy-optionalbyrel');
const assembleResponse = require('./assemble-response');
const queryStats = require('./query-stats');

// eslint-disable-next-line no-unused-vars
exports.doYourJob = function (sh, query, limit = 10, offset = 0, stats = 1, sortMode = 0, minRelevance = 4, span = 720, linear = false) {
  return new Promise((resolve, reject) => {
    const hrstart = process.hrtime();
    if (process.env.NODE_ENV === 'development') stats = 0;

    // param sanitization
    if (offset < 0) offset = 0;
    if (query == undefined) reject({ message: 'Please enter your query.' });
    if (query.length < 1 || query === ' ') reject({ message: 'Please enter your query.' });

    // many queries in one as COMMA (,) works like OR
    let queries = [];
    if (query.includes(',')) {
      query.split(',').forEach(v => queries.push(v));
      if (queries.length > 10) queries = queries.slice(0, 10);
    } else {
      queries.push(query);
    }

    // cycle for each query
    const queriesToDb = [];
    const workingQueries = [];
    queries.forEach((q) => {
      // query sanitization
      const workingQuery = querySanitization.sanitize(q);
      workingQueries.push(workingQuery);

      // sanitization can reduce query to 0
      if (queries.length === 1 && workingQuery.length < 1) reject({ message: 'Please enter your query.' });

      // query processing
      nlpProcessQuery.returnVariants(workingQuery).forEach(e => queriesToDb.push(e));
    });

    // query processing
    const queriesMap = new Map();
    queriesToDb.forEach(e => queriesMap.set(e.q, { w: e.w, s: e.s, a: e.a }));

    // database querying
    sh.select('term', 'relevant', 'relevant_abstract')
      .from('index_title')
      .where('term', 'IN', "('" + queriesToDb.map(e => e.q).join("', '") + "')")
      .run()
      .then((result) => {
        // assembling and returning the results
        if (Object.keys(result).length !== 0) {
          // a lot of calculating, assembling and cleaning of results
          const initialResults = assembleResults.assemble(result, queriesMap, workingQueries, minRelevance);

          // failsafes for offsets and no results
          const offsetAsNumber = parseInt(offset, 10);
          if (initialResults.finalList.size === 0) {
            if (stats) {
              reject({
                message: 'There are no new preprints about <i>' + query
                  + '</i>. Would you like to rephrase your query?',
              });
            } else {
              resolve({
                message: 'There are no new preprints about <i>' + query
                  + '</i>. Would you like to rephrase your query?',
              });
            }
          } else if (offsetAsNumber >= initialResults.finalList.size) {
            reject({ message: 'Sorry, there are no more results for <i>' + query + '</i>.' });
          }

          let arrayOfQueries = [];
          const numberOfImportantWords = relativeWeightModule.theNumberOfWords(workingQueries);
          const limitOfRelevancy = relativeWeightModule.theLimit(numberOfImportantWords, minRelevance);

          if (linear === true) {
            /* Providing only newest relevant for NOTIFICATIONS */
            arrayOfQueries = strategyNotifications.provideQueries(sh, initialResults.finalList,
              limitOfRelevancy, parseInt(span, 10));
            if (arrayOfQueries.length == 0) {
              reject({
                message:
                    'Sorry, there are no sufficiently relevant results for <i>' + query + '</i>.',
              });
            }
          } else if (sortMode == 0) { // leave == as sometimes comes undefined
            /* Default sorting relevant by DATE */
            arrayOfQueries = strategyDefaultbydate.provideQueries(sh, initialResults.finalList,
              limitOfRelevancy, offsetAsNumber);
          } else {
            /* Sorting relevant by RELEVANCY */
            arrayOfQueries = strategyOptionalbyrel.provideQueries(sh, initialResults.finalList,
              offsetAsNumber, parseInt(span, 10));
          }

          const arrayOfQueriesDEBUG = arrayOfQueries.map(v => v.build());
          arrayOfQueries = arrayOfQueries.map(v => v.run());

          // 3
          Promise.all(arrayOfQueries)
            .then((arrayOfResults) => {
              let properArray = []; // will be just 10 results
              // eslint-disable-next-line eqeqeq
              if (arrayOfQueries == undefined) {
                if (stats) {
                  reject({
                    message: 'There are no new preprints about <i>' + query
                      + '</i>. Would you like to rephrase your query?',
                  });
                } else {
                  resolve({
                    message: 'There are no new preprints about <i>' + query
                      + '</i>. Would you like to rephrase your query?',
                  });
                }
              }

              // we can have few arrays from few queries
              if (arrayOfQueries.length === 3) {
                properArray = arrayOfResults[0].concat(
                  arrayOfResults[1],
                  arrayOfResults[2],
                );
              } else if (arrayOfQueries.length === 2) {
                properArray = arrayOfResults[0].concat(arrayOfResults[1]);
              } else if (arrayOfQueries.length === 1) {
                // eslint-disable-next-line prefer-destructuring
                properArray = arrayOfResults[0];
              } else if (arrayOfQueries.length === 0) {
                if (stats) {
                  reject({
                    message: 'There are no new preprints about <i>' + query
                      + '</i>. Would you like to rephrase your query?',
                  });
                } else {
                  resolve({
                    message: 'There are no new preprints about <i>' + query
                      + '</i>. Would you like to rephrase your query?',
                  });
                }
              }

              // eslint-disable-next-line eqeqeq
              if (properArray == undefined) {
                // eslint-disable-next-line eqeqeq
                if (stats == 1) reject({ message: 'Sorry, there are no more results for <i>' + query + '</i>.' });
                else resolve({ message: 'No new results for notification to <i>' + query + '</i>.' });
              } else if (properArray.length === 0) {
                if (stats) {
                  reject({
                    message: 'There are no new preprints about <i>' + query
                      + '</i>. Would you like to rephrase your query?',
                  });
                } else {
                  resolve({
                    message: 'There are no new preprints about <i>' + query
                      + '</i>. Would you like to rephrase your query?',
                  });
                }
              }
              // normal user wants just 10, but in case of notifications we want all
              if (properArray.length > 10 && linear === false) { properArray = properArray.slice(0, 10); }

              const listOfWords = initialResults.originalTerms
                .join(' ')
                .split(' ')
                .filter((v, i, s) => s.indexOf(v) === i);
              listOfWords.sort((a, b) => {
                if (a.length > b.length) return -1;
                if (a.length < b.length) return 1;
                return 0;
              }); // quickfix to avoid double stronging plurals (like signal and signals)

              // modifying titles, calculating relative weights etc
              const publications = assembleResponse.provideResults(properArray,
                initialResults.finalList, listOfWords, relativeWeightModule.theNumberOfWords(workingQueries));

              // eslint-disable-next-line eqeqeq
              if (parseInt(offset, 10) == 0 && stats == 1) {
                let quality = 0;
                quality = publications[0].relativeWeight / 2;
                if (publications.length >= 5) { quality += publications[4].relativeWeight / 4; }
                if (publications.length >= 10) { quality += publications[9].relativeWeight / 4; }
                const newestResult = new Date(properArray[0].date).getTime();

                const hrend = process.hrtime(hrstart);

                const details = '{"timestamp":"' + Date.now() + '","howManyRelevant":"'
                  + 0 + '","highestRelevancy":"0","executionTime":"'
                  + (hrend[1] / 1000000 + hrend[0] * 1000).toFixed(0) + '","newestResult":"'
                  + newestResult.toFixed(0) + '"}';
                queryStats.register(sh, workingQueries.join(', '), quality.toFixed(0), details,
                  parseInt((hrend[1] / 1000000 + hrend[0] * 1000).toFixed(0), 10));
              }

              // returning results!
              resolve({
                numberofall: initialResults.finalList.size,
                results: publications,
              });
            })
            .catch((e) => {
              if (stats) {
                queryStats.register(sh, workingQueries.join(', '), '0', '{"timestamp":"' + Date.now()
                  + '","error":"' + escape(e.toString()) + '"}');
              }
              logger.error('line 153');
              logger.error(e);
              logger.error(arrayOfQueriesDEBUG);
              reject({ message: 'Sorry, we have encountered an error.' });
            });
        } else {
          // eslint-disable-next-line no-lonely-if
          if (stats) {
            queryStats.register(sh, workingQueries.join(', '), '0',
              '{"timestamp":"' + Date.now() + '","error":"no results"}');
            reject({
              message: 'There are no new preprints about <i>' + query
                + '</i>. Would you like to rephrase your query?',
            });
          } else {
            resolve({
              message: 'There are no new preprints about <i>' + query
                + '</i>. Would you like to rephrase your query?',
            });
          }
        }
      })
      .catch((e) => {
        if (stats) {
          queryStats.register(sh, workingQueries.join(', '), '0',
            '{"timestamp":"' + Date.now() + '","error":"' + escape(e.toString()) + '"}');
        }
        logger.error('line 173');
        logger.error(e);
        reject({ message: 'Sorry, we have encountered an error.' });
      });
  });
};
