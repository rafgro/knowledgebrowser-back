/* eslint-disable brace-style */
/* eslint-disable max-len */

const nlp = require('compromise');
const loader = require('../../loaders');

exports.index = function (whichId, canStop) {
  loader.database
    .select('title', 'id')
    .from('content_preprints')
    .where('id', '=', whichId)
    .run()
    .then((title) => {
      // eslint-disable-next-line prefer-destructuring
      const id = title[0].id; // title[0];

      const titleProper = unescape(title[0].title)
        .replace(RegExp(' \\(arXiv:.*\\)'), '')
        .replace(RegExp('\\$', 'g'), '')
        .replace(/\\"/g, '')
        .replace(/\{/g, '')
        .replace(/\}/g, '')
        .replace(/\//g, ' ')
        .replace(/\\/g, ' ');
      // logger.info(titleProper);

      /*

        DRAFT of indexing strategy:
        - escape $something$ and (arxiv:something)
        - assign weight to the pair term-pub, higher means higher relevancy, optimally should be one number only (1-9)
        - add terms to db always as normalized ('normal' property)
        - to avoid duplication of single words, we should start with array containing informations about state
          (0 - to insert, 1 - inserted), which can be filled by acronyms or ready nouns before reaching single words
        - verbs are scarce and should guide work around title, things around verbs should have most weight (like +1 to default),
          start with array marking weight two words from verb in both directions
        - (weight:8) extract hyphenated terms because they are often very specific and the module doesn't handle them well
        - (weight:8) extract acronyms and place them with high weight
        - (weight:7) extract pairs adjective-noun (in various combinations), noun-noun, verb-noun, acronym-noun, value-noun
        - (weight:6) get ready nouns from module (often multi-word), we need correction mechanism for cutting out hyphenated words,
          possibly start with checking if there is hyphen before or after the noun (extreme example: i've seen 'non-' cut out!),
          an article 'the' should have more weight (+1)
        - (weight:5) all tagged words: add single nouns if they weren't added
        - (weight:4) all tagged words: add single adjectives and values
        - (weight:3) all tagged words: parentheses with cleared '(' and ')'

        */

      const nlpTitle = nlp(titleProper);
      let words = nlpTitle.terms().data();

      // console.log(words);

      let toDb = [];

      // handling cases with bad tagging
      for (let i = 0; i < words.length; i += 1) {
        if (words[i].tags.length === 1) {
          // single title case happens for words like Th17
          if (words[i].tags[0] === 'TitleCase') {
            nlpTitle.match(words[i].normal).tag('Noun');
          }
        }
      }

      // let's go
      words = nlpTitle.terms().data();

      // hyphenated terms
      nlpTitle
        .match('#Hyphenated')
        .out('text')
        .toString()
        .split(' ')
        .forEach((element) => {
          if (element.length > 1) {
            toDb.push({ t: element, w: 8 });
          }
        });

      // acronyms
      nlpTitle
        .acronyms()
        .data()
        .forEach((element) => {
          if (element.text.length > 0) {
            toDb.push({ t: element.text, w: 8 });
          }
        });

      // create array of weight change based on verb proximity
      const checkIfVerb = word => word === 'Verb';
      const weightArrayPerWord = new Array(words.length);
      weightArrayPerWord.fill(0);
      for (let i = 0; i < words.length; i += 1) {
        if (words[i].tags.find(checkIfVerb)) {
          // -2
          if (i - 2 >= 0) {
            weightArrayPerWord[i - 2] = 1;
          }
          // -1
          if (i - 1 >= 0) {
            weightArrayPerWord[i - 1] = 1;
          }
          // +1
          if (i + 1 <= words.length - 1) {
            weightArrayPerWord[i + 1] = 1;
          }
          // +2
          if (i + 2 <= words.length - 1) {
            weightArrayPerWord[i + 2] = 1;
          }
        }
      }

      // pairs with nouns: adjectives, verbs, acronyms, other nouns
      const checkIfNoun = word => word === 'Noun';
      const checkIfAdjective = word => word === 'Adjective';
      const checkIfAcronym = word => word === 'Acronym';
      const checkIfValue = word => word === 'Value';
      for (let i = 0; i < words.length; i += 1) {
        if (words[i].tags.find(checkIfNoun)) {
          if (i > 0) {
            // pair: adjective - noun
            if (words[i - 1].tags.find(checkIfAdjective)) {
              toDb.push({
                t: words[i - 1].normal + ' ' + words[i].normal,
                w: 7 + weightArrayPerWord[i - 1] + weightArrayPerWord[i],
              });
            }
            // pair: verb - noun
            else if (words[i - 1].tags.find(checkIfVerb)) {
              toDb.push({
                t: words[i - 1].normal + ' ' + words[i].normal,
                w: 5,
              });
            }
            // pair: acronym - noun
            else if (words[i - 1].tags.find(checkIfAcronym)) {
              toDb.push({
                t: words[i - 1].normal + ' ' + words[i].normal,
                w: 6 + weightArrayPerWord[i - 1] + weightArrayPerWord[i],
              });
            }
            // pair: value - noun
            else if (words[i - 1].tags.find(checkIfValue)) {
              toDb.push({
                t: words[i - 1].normal + ' ' + words[i].normal,
                w: 6 + weightArrayPerWord[i - 1] + weightArrayPerWord[i],
              });
            }
            // pair: noun - noun
            else if (words[i - 1].tags.find(checkIfNoun)) {
              toDb.push({
                t: words[i - 1].normal + ' ' + words[i].normal,
                w: 6 + weightArrayPerWord[i - 1] + weightArrayPerWord[i],
              });
            }
          }
          if (i + 1 < words.length) {
            // pair: noun - adjective
            if (words[i + 1].tags.find(checkIfAdjective)) {
              toDb.push({
                t: words[i].normal + ' ' + words[i + 1].normal,
                w: 7 + weightArrayPerWord[i] + weightArrayPerWord[i + 1],
              });
            }
            // pair: noun - verb
            else if (words[i + 1].tags.find(checkIfVerb)) {
              toDb.push({
                t: words[i].normal + ' ' + words[i + 1].normal,
                w: 5,
              });
            }
            // pair: noun - acronym
            else if (words[i + 1].tags.find(checkIfAcronym)) {
              toDb.push({
                t: words[i].normal + ' ' + words[i + 1].normal,
                w: 6 + weightArrayPerWord[i] + weightArrayPerWord[i + 1],
              });
            }
            // pair: noun - value
            else if (words[i + 1].tags.find(checkIfValue)) {
              toDb.push({
                t: words[i].normal + ' ' + words[i + 1].normal,
                w: 6 + weightArrayPerWord[i] + weightArrayPerWord[i + 1],
              });
            }
            // pair: noun - noun
            else if (words[i + 1].tags.find(checkIfNoun)) {
              toDb.push({
                t: words[i].normal + ' ' + words[i + 1].normal,
                w: 6 + weightArrayPerWord[i] + weightArrayPerWord[i + 1],
              });
            }
          }
        }
      }

      const getPreviousWord = (sentence) => {
        const toReturn = [];
        for (let i = sentence.length - 1; i >= 0; i -= 1) {
          if (sentence.charAt(i) === ' ') {
            break;
          }
          toReturn.unshift(sentence.charAt(i));
        }
        return toReturn.join('');
      };
      const getNextWord = (sentence) => {
        const toReturn = [];
        for (let i = 0; i < sentence.length; i += 1) {
          if (sentence.charAt(i) === ' ') {
            break;
          }
          toReturn.push(sentence.charAt(i));
        }
        return toReturn.join('');
      };

      // nouns grouped by the module
      nlpTitle
        .nouns()
        .data()
        .forEach((element) => {
          if (element.normal.length > 1) {
            let weight = 7;
            if (element.article === 'the') {
              weight = 8;
            }

            if (element.normal.split(' ').length > 5) {
              return;
            }

            if (
              titleProper.charAt(titleProper.indexOf(element.text) - 1) === '-'
            ) {
              toDb.push({
                t:
                  getPreviousWord(
                    titleProper.substring(0, titleProper.indexOf(element.text)),
                  ) + element.text,
                w: weight,
              });
            } else if (element.text.charAt(element.text.length - 1) === '-') {
              if (element.text.charAt(0) === ' ') {
                toDb.push({
                  t:
                    element.text.substring(1)
                    + getNextWord(
                      titleProper.substring(
                        titleProper.indexOf(element.text) + element.text.length,
                      ),
                    ),
                  w: weight,
                });
              } else {
                toDb.push({
                  t:
                    element.text
                    + getNextWord(
                      titleProper.substring(
                        titleProper.indexOf(element.text) + element.text.length,
                      ),
                    ),
                  w: weight,
                });
              }
            } else if (element.text.charAt(0) === ' ') {
              toDb.push({
                t: element.text.substring(1),
                w: weight,
              });
            } else {
              toDb.push({
                t: element.text,
                w: weight,
              });
            }
          }
        });

      // single words
      nlpTitle
        .terms()
        .data()
        .forEach((element) => {
          if (element.tags.find(checkIfNoun)) {
            toDb.push({ t: element.normal, w: 3 });
          }
          if (element.tags.find(checkIfAdjective)) {
            toDb.push({ t: element.normal, w: 2 });
          }
          if (element.tags.find(value => value === 'Value')) {
            toDb.push({ t: element.normal, w: 3 });
          }
          if (element.tags.find(value => value === 'Parentheses')) {
            toDb.push({ t: element.normal, w: 3 });
          }
          if (element.tags.find(value => value === 'Adverb')) {
            toDb.push({ t: element.normal, w: 2 });
          }
          if (element.tags.find(checkIfVerb)) {
            toDb.push({ t: element.normal, w: 2 });
          }
        });

      // normalization
      toDb = toDb.map(element => ({
        t: element.t
          .replace(RegExp(',', 'g'), '')
          .replace(RegExp('-', 'g'), ' ')
          .replace(RegExp('\\.', 'g'), '')
          .replace(RegExp(':', 'g'), '')
          .replace(RegExp("'", 'g'), '')
          .replace(RegExp('\\\\', 'g'), '')
          .replace(RegExp(' +$'), '')
          .replace(RegExp(' {2}'), ' ')
          .replace(RegExp('\\(', 'g'), ' ')
          .replace(RegExp('\\)', 'g'), ' ')
          .toLowerCase(),
        w: element.w,
      }));

      // cutting out duplicated terms
      toDb = toDb.filter(function (a) {
        // eslint-disable-next-line no-return-assign
        return !this[a.t] && (this[a.t] = true);
      }, Object.create(null));

      // console.log(toDb);

      // insertion to database

      let insertionCounter = 0;
      function checkInsertionCounter() {
        if (insertionCounter === toDb.length - 1 && canStop === true) {
          // logger.info('Stopping indexing');
          // loader.database.stop();
        }
      }

      toDb.forEach((element) => {
        loader.database
          .select('term', 'relevant')
          .from('index_title')
          .where('term', '=', element.t)
          .run()
          .then((returned) => {
            // eslint-disable-next-line eqeqeq
            if (Object.keys(returned).length != 0) {
              // term is present
              // now there are two possible scenarios:
              // false - term is already associated with this publication, therefore we don't undertake any db operation
              // true - term is associated only with other publications
              let scenario = true;
              let relevant = [];

              // eslint-disable-next-line eqeqeq
              if (returned[0].relevant != undefined) {
                relevant = JSON.parse(returned[0].relevant);
                relevant.forEach((onepub) => {
                  // eslint-disable-next-line eqeqeq
                  if (onepub.p == id) {
                    scenario = false;
                  }
                });
              }

              if (scenario === true) {
                relevant.push({ p: id, w: element.w });
                loader.database
                  .update('index_title')
                  .set('relevant', "'" + JSON.stringify(relevant) + "'")
                  .where('term', '=', element.t)
                  .run()
                  .then(() => {
                    // logger.info('Inserted '+element.t);
                    insertionCounter += 1;
                    checkInsertionCounter();
                  })
                  .catch((e) => {
                    logger.error(e);
                    logger.error(
                      loader.database
                        .update('index_title')
                        .set('relevant', "'" + JSON.stringify(relevant) + "'")
                        .where('term', '=', element.t)
                        .build(),
                    );
                  });
              } else {
                // logger.info(element.t + ' existed');
                insertionCounter += 1;
                checkInsertionCounter();
              }
            } else {
              loader.database
                .insert({
                  term: element.t,
                  relevant: '\'[{"p":"' + id + '","w":' + element.w + "}]'",
                })
                .into('index_title')
                .run()
                .then(() => {
                  // logger.info('Inserted '+element.t);
                  insertionCounter += 1;
                  checkInsertionCounter();
                })
                // eslint-disable-next-line no-unused-vars
                .catch((e) => {
                  // sorry its just quickfix

                  let scenario = true;
                  let relevant = [];

                  // eslint-disable-next-line eqeqeq
                  if (returned[0] != undefined) {
                    // eslint-disable-next-line eqeqeq
                    if (returned[0].relevant != undefined) {
                      relevant = JSON.parse(returned[0].relevant);
                      relevant.forEach((onepub) => {
                        // eslint-disable-next-line eqeqeq
                        if (onepub.p == id) {
                          scenario = false;
                        }
                      });
                    }
                  }

                  if (scenario === true) {
                    relevant.push({ p: id, w: element.w });
                    loader.database
                      .update('index_title')
                      .set('relevant', "'" + JSON.stringify(relevant) + "'")
                      .where('term', '=', element.t)
                      .run()
                      .then(() => {
                        // logger.info('Inserted '+element.t);
                        insertionCounter += 1;
                        checkInsertionCounter();
                      })
                      .catch((ech) => {
                        logger.error(ech);
                        logger.error(
                          loader.database
                            .update('index_title')
                            .set('relevant', "'" + JSON.stringify(relevant) + "'")
                            .where('term', '=', element.t)
                            .build(),
                        );
                      });
                  } else {
                    // logger.info(element.t + ' existed');
                    insertionCounter += 1;
                    checkInsertionCounter();
                  }

                  // logger.error(e);
                });
            }
          })
          .catch((e) => {
            logger.error(e);
            logger.error(
              loader.database
                .select('term', 'relevant')
                .from('index_title')
                .where('term', '=', element.t)
                .build(),
            );
          });
      });
    })
    .catch((e) => {
      logger.error(e);
      logger.error(
        loader.database
          .select('title', 'id')
          .from('content_preprints')
          .where('id', '=', whichId)
          .build(),
      );
    });
};
