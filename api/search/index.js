/* eslint-disable no-else-return */
/* eslint-disable no-param-reassign */
/* eslint-disable no-loop-func */
/* eslint-disable max-len */
/* eslint-disable eqeqeq */

const querySanitization = require('./query-sanitization');
const nlpProcessQuery = require('./nlp-process-query');
const assembleResults = require('./assemble-results');
const strategyNotifications = require('./strategy-notifications');
const strategyDefaultbydate = require('./strategy-defaultbydate');
const strategyOptionalbyrel = require('./strategy-optionalbyrel');
const assembleResponse = require('./assemble-response');
const queryStats = require('./query-stats');

// eslint-disable-next-line no-unused-vars
exports.doYourJob = function (sh, query, limit = 10, offset = 0, stats = 1, sortMode = 0, minRelevance = 4, span = 720, linear = false) {
  return new Promise((resolve, reject) => {
    const hrstart = process.hrtime();

    // param sanitization
    if (offset < 0) offset = 0;
    if (query == undefined) reject({ message: 'Please enter your query.' });
    if (query.length < 1 || query === ' ') reject({ message: 'Please enter your query.' });

    // query sanitization
    const workingQuery = querySanitization.sanitize(query);

    // sanitization can reduce query to 0
    if (workingQuery.length < 1) reject({ message: 'Please enter your query.' });

    // query processing
    const queriesToDb = nlpProcessQuery(workingQuery);
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
          const initialResults = assembleResults.assemble(result, queriesMap);

          // failsafes for offsets and no results
          const offsetAsNumber = parseInt(offset, 10);
          if (offsetAsNumber >= initialResults.finalList.size) {
            reject({ message: 'Sorry, there are no more results for <i>' + query + '</i>.' });
          } else if (initialResults.finalList.size === 0) {
            reject({
              message: 'There are no new preprints about <i>' + query
                + '</i>. Would you like to rephrase your query?',
            });
          }

          let arrayOfQueries = [];

          if (linear === true) {
            /* Providing only newest relevant for NOTIFICATIONS */
            arrayOfQueries = strategyNotifications.provideQueries(sh, initialResults.finalList,
              limitOfRelevancy, span);
            if (arrayOfQueries.length == 0) {
              reject({
                message:
                    'Sorry, there are no sufficiently relevant results for <i>' + query + '</i>.',
              });
            }
          } else if (sortMode === 0) {
            /* Default sorting relevant by DATE */
            arrayOfQueries = strategyDefaultbydate.provideQueries(sh, initialResults.finalList,
              limitOfRelevancy, offsetAsNumber);
          } else {
            /* Sorting relevant by RELEVANCY */
            arrayOfQueries = strategyOptionalbyrel.provideQueries(sh, initialResults.finalList,
              offsetAsNumber);
          }

          const arrayOfQueriesDEBUG = arrayOfQueries.map(v => v.build());
          arrayOfQueries = arrayOfQueries.map(v => v.run());

          // 3
          Promise.all(arrayOfQueries)
            .then((arrayOfResults) => {
              let properArray = []; // will be just 10 results
              // eslint-disable-next-line eqeqeq
              if (arrayOfQueries == undefined) reject({ message: 'Sorry, there are no more results for <i>' + query + '</i>.' });

              // we can have few arrays from few queries
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

              // normal user wants just 10, but in case of notifications we want all
              if (properArray.length > 10 && linear === false) { properArray = properArray.slice(0, 10); }
              // eslint-disable-next-line eqeqeq
              if (properArray == undefined) {
                // eslint-disable-next-line eqeqeq
                if (stats == 1) reject({ message: 'Sorry, there are no more results for <i>' + query + '</i>.' });
                else resolve({ message: 'No new results for notification to <i>' + query + '</i>.' });
                // ^ this is to not pollute error monitoring with simple lack of new results
              }

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
                initialResults.finalList, listOfWords, workingQuery.split(' ').length - 1);

              // eslint-disable-next-line eqeqeq
              if (parseInt(offset, 10) == 0 && stats == 1) {
                let quality = 0;
                quality = publications[0].relativeWeight / 2;
                if (publications.length >= 5) { quality += publications[4].relativeWeight / 4; }
                if (publications.length >= 10) { quality += publications[9].relativeWeight / 4; }
                const newestResult = new Date(properArray[0].date).getTime();

                const hrend = process.hrtime(hrstart);

                const details = '{"timestamp":"' + Date.now() + '","howManyRelevant":"'
                  + 0 + '","highestRelevancy":"' + highestRelevancy + '","executionTime":"'
                  + (hrend[1] / 1000000 + hrend[0] * 1000).toFixed(0) + '","newestResult":"'
                  + newestResult.toFixed(0) + '"}';
                queryStats.register(sh, workingQuery, quality.toFixed(0), details,
                  parseInt((hrend[1] / 1000000 + hrend[0] * 1000).toFixed(0), 10));
              }

              // returning results!
              resolve({
                numberofall: initialResults.finalList.size,
                results: publications,
              });
            })
            .catch((e) => {
              queryStats.register(sh, workingQuery, '0', '{"timestamp":"' + Date.now()
                  + '","error":"' + escape(e.toString()) + '"}');
              logger.error('line 153');
              logger.error(e);
              logger.error(arrayOfQueriesDEBUG);
              reject({ message: 'Sorry, we have encountered an error.' });
            });
        } else {
          queryStats.register(sh, workingQuery, '0',
            '{"timestamp":"' + Date.now() + '","error":"no results"}');
          logger.error('no results for ' + query);
          reject({
            message:
              'There are no new preprints about <i>'
              + query
              + '</i>. Would you like to rephrase your query?',
          });
        }
      })
      .catch((e) => {
        queryStats.register(sh, workingQuery, '0',
          '{"timestamp":"' + Date.now() + '","error":"' + escape(e.toString()) + '"}');
        logger.error('line 173');
        logger.error(e);
        reject({ message: 'Sorry, we have encountered an error.' });
      });
  });
};
