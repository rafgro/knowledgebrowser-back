/* eslint-disable brace-style */

const nlp = require('compromise');
const striptags = require('striptags');
const loader = require('../../loaders');

exports.index = function (whichId) {
  loader.database
    .select('abstract', 'id')
    .from('content_preprints')
    .where('id', '=', whichId)
    .run()
    // eslint-disable-next-line consistent-return
    .then((abstract) => {
      if (abstract[0].abstract.length < 50) {
        return false;
      }

      // eslint-disable-next-line prefer-destructuring
      const id = abstract[0].id;

      const abstractProper = striptags(
        unescape(abstract[0].abstract)
          .replace(/\r?\n|\r/g, ' ')
          .replace(RegExp('\\$', 'g'), '')
          .replace(/\//g, ' ')
          .replace(/\\/g, ' ')
          .toString(),
      );

      /*

        DRAFT of indexing strategy:
        - escape vulnerable characters
        - divide abstract to sentences
        - append relative weight to each sentence (0.2 - 0.3 - 0.4)
          which will be multiplier of original title weight
        - index each sentence like in title algorithm

      */

      const nlpAbstract = nlp(abstractProper);
      const sentences = nlpAbstract
        .sentences()
        .data()
        .map((e) => {
          const tempRelWeight = 1;
          // in the future here work out sort of sentence importance analysis
          // (like however or in addition should have lower importance)
          return { text: e.text, relWeight: tempRelWeight };
        });

      let toDb = [];

      sentences.forEach((oneSentence) => {
        const nlpSentence = nlp(oneSentence.text);
        let words = nlpSentence.terms().data();

        // handling cases with bad tagging
        for (let i = 0; i < words.length; i += 1) {
          if (words[i].tags.length === 1) {
            // single title case happens for words like Th17
            if (words[i].tags[0] === 'TitleCase') {
              nlpSentence.match(words[i].normal).tag('Noun');
            }
          }
        }

        // let's go
        words = nlpSentence.terms().data();

        // hyphenated terms
        nlpSentence
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
        nlpSentence
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
        nlpSentence
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
                oneSentence.text.charAt(
                  oneSentence.text.indexOf(element.text) - 1,
                ) === '-'
              ) {
                toDb.push({
                  t:
                    getPreviousWord(
                      oneSentence.text.substring(
                        0,
                        oneSentence.text.indexOf(element.text),
                      ),
                    ) + element.text,
                  w: weight,
                });
              } else if (element.text.charAt(element.text.length - 1) === '-') {
                if (element.text.charAt(0) === ' ') {
                  toDb.push({
                    t:
                      element.text.substring(1)
                      + getNextWord(
                        oneSentence.text.substring(
                          oneSentence.text.indexOf(element.text)
                            + element.text.length,
                        ),
                      ),
                    w: weight,
                  });
                } else {
                  toDb.push({
                    t:
                      element.text
                      + getNextWord(
                        oneSentence.text.substring(
                          oneSentence.text.indexOf(element.text)
                            + element.text.length,
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
        nlpSentence
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
            .toLowerCase(),
          w: element.w,
        }));
      });

      toDb = toDb.filter(
        function (a) {
          // eslint-disable-next-line no-return-assign
          return !this[a.t] && (this[a.t] = true);
        },
        Object.create(null),
      );

      const clearedAbstract = nlp(abstractProper)
        .normalize()
        .sentences()
        .out()
        .replace(/\./g, '');
      toDb = toDb.map((element) => {
        let wei = element.w;
        const howMany = clearedAbstract.split(element.t).length - 1;
        if (howMany >= 15) wei *= 0.3;
        else if (howMany >= 3) wei *= 3;
        else if (howMany >= 2) wei *= 2;
        if (wei < 1) wei = 1;
        return { t: element.t, w: (wei * 0.3).toFixed(1) };
      });
      toDb.sort((a, b) => parseFloat(b.w) - parseFloat(a.w));

      toDb.forEach((element) => {
        loader.database
          .select('term', 'relevant_abstract')
          .from('index_title')
          .where('term', '=', "'" + element.t + "'")
          .run()
          .then((returned) => {
            if (Object.keys(returned).length !== 0) {
              // term is present
              // now there are two possible scenarios:
              // false - term is already associated with this publication,
              //   therefore we don't undertake any db operation
              // true - term is associated only with other publications
              let scenario = true;

              let relevant = [];
              if (returned[0].relevant_abstract !== undefined) {
                relevant = JSON.parse(returned[0].relevant_abstract);
                relevant.forEach((onepub) => {
                  if (onepub.p === id) {
                    scenario = false;
                  }
                });
              }

              if (scenario === true) {
                relevant.push({ p: id, w: element.w });
                loader.database
                  .update('index_title')
                  .set(
                    'relevant_abstract',
                    "'" + JSON.stringify(relevant) + "'",
                  )
                  .where('term', '=', "'" + element.t + "'")
                  .run()
                  .then(() => {
                    logger.info('Updated ' + element.t);
                  })
                  .catch((e) => {
                    logger.error(e.toString());
                    logger.error(
                      loader.database
                        .update('index_title')
                        .set(
                          'relevant_abstract',
                          "'" + JSON.stringify(relevant) + "'",
                        )
                        .where('term', '=', element.t)
                        .build(),
                    );
                  });
              } else {
                logger.info(element.t + ' existed');
              }
            } else {
              loader.database
                .insert({
                  term: "'" + element.t + "'",
                  relevant_abstract:
                    '\'[{"p":"' + id + '","w":' + element.w + "}]'",
                })
                .into('index_title')
                .run()
                .then(() => {
                  logger.info('Inserted ' + element.t);
                })
                .catch((e) => {
                  logger.error(e.toString());
                  logger.error(
                    loader.database
                      .insert({
                        term: element.t,
                        relevant_abstract:
                          '\'[{"p":"' + id + '","w":' + element.w + "}]'",
                      })
                      .into('index_title')
                      .build(),
                  );
                });
            }
          })
          .catch((e) => {
            logger.error(e.toString());
            logger.error(
              loader.database
                .select('term', 'relevant_abstract')
                .from('index_title')
                .where('term', '=', element.t)
                .build(),
            );
          });
      });
    })
    .catch((e) => {
      logger.error(e.toString());
    });
};
