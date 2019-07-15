/* eslint-disable no-loop-func */
/* eslint-disable newline-per-chained-call */
/* eslint-disable brace-style */

const nlp = require('compromise');

// helper funs for part of speech tagged by compromise
const checkIfNoun = word => word === 'Noun';
const checkIfAdjective = word => word === 'Adjective' || word === 'Comparable';
const checkIfAcronym = word => word === 'Acronym';
const checkIfValue = word => word === 'Value';
const checkIfVerb = word => word === 'Verb';

exports.returnVariants = function (workingQuery) {
  // table of objects which is returned
  let queriesToDb = [];
  /* each object has properties:
    -q: query to database,
    -w: weight of this query,
    -s: scope of coverage of original query,
    -a: true if looking in abstract */

  const queryNlp = nlp(workingQuery); // query is sanitized, consists only of words and spaces
  const words = queryNlp.terms().data(); // main purpose: determining parts of speech

  let oneword = true; // quicker processing in case of one word
  if (workingQuery.includes(' ')) oneword = false;

  // quick and dirty one word query
  if (oneword) {
    // original normalized form
    queriesToDb.push({ q: queryNlp.normalize().toLowerCase().out(),
      w: 10, s: workingQuery, a: true });
    // singular nouns
    queriesToDb.push({ q: queryNlp.nouns().toSingular().all().normalize().toLowerCase().out(),
      w: 10, s: workingQuery, a: true });
    // plural nouns
    queriesToDb.push({ q: queryNlp.nouns().toPlural().all().normalize().toLowerCase().out(),
      w: 10, s: workingQuery, a: true });

    // other variants
    if (words[0].tags.find(checkIfNoun)) {
      populateNounToForms(words[0].normal).forEach((e) => {
        queriesToDb.push({ q: e, w: 4, s: words[0].text, a: true });
      });
    } else if (words[0].tags.find(checkIfVerb)) {
      populateVerbToForms(words[0].normal).forEach((e) => {
        queriesToDb.push({ q: e, w: 3, s: words[0].text, a: true });
      });
    } else if (words[0].tags.find(checkIfAdjective)) {
      populateNounToForms(words[0].normal).forEach((e) => {
        queriesToDb.push({ q: e, w: 2, s: words[0].text, a: true });
      });
    }
  }
  // multiple words in query
  else {
    // pairs with nouns should have generally high weight
    for (let i = 0; i < words.length; i += 1) {
      if (words[i].tags.find(checkIfNoun)) {
        // looking for pair something - noun
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
            // original pair
            queriesToDb.push({
              q: words[i - 1].normal + ' ' + words[i].normal,
              w: weight,
              s: words[i - 1].text + ' ' + words[i].text,
              a: true,
            });

            // noun changed to singular or plural
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

            // something changed to singular or plural
            if (words[i - 1].normal.charAt(words[i - 1].normal.length - 1) !== 's') {
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

            // variants of noun
            populateNounToForms(words[i].normal).forEach(e => queriesToDb.push({
              q: words[i - 1].normal + ' ' + e,
              w: weight,
              s: words[i - 1].text + ' ' + words[i].text,
              a: true,
            }));

            // variants of something
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

        // looking for pair noun - something
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
            // original form
            queriesToDb.push({
              q: words[i].normal + ' ' + words[i + 1].normal,
              w: weight,
              s: words[i].text + ' ' + words[i + 1].text,
              a: true,
            });

            // noun changed to singular or plural
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

            // something changed to singular or plural
            if (words[i + 1].normal.charAt(words[i + 1].normal.length - 1) !== 's') {
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

            // variants of noun
            populateNounToForms(words[i].normal).forEach(e => queriesToDb.push({
              q: e + ' ' + words[i + 1].normal,
              w: weight,
              s: words[i].text + ' ' + words[i + 1].text,
              a: true,
            }));

            // variants of something
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

    // single words
    words.forEach((word) => {
    // eslint-disable-next-line no-empty, brace-style, eqeqeq
      if (word.normal == 'on' || word.normal == 'of' || word.normal == 'in') { } // no action
      else if (word.tags.find(checkIfNoun)) {
        // single nouns
        queriesToDb.push({ q: word.normal, w: 4, s: word.text, a: true });
        populateNounToForms(word.normal).forEach(e => queriesToDb.push({
          q: e,
          w: 4,
          s: word.text,
          a: true,
        }));
      } else if (word.tags.find(checkIfVerb)) {
        // single verbs
        queriesToDb.push({ q: word.normal, w: 4, s: word.text, a: true });
        populateVerbToForms(word.normal).forEach(e => queriesToDb.push({
          q: e,
          w: 3,
          s: word.text,
          a: true,
        }));
      } else if (word.tags.find(checkIfAdjective)) {
        // single adjectives
        queriesToDb.push({ q: word.normal, w: 3, s: word.text });
        populateNounToForms(word.normal).forEach(e => queriesToDb.push({
          q: e,
          w: 2,
          s: word.text,
          a: false,
        }));
      } else if (word.tags.find(checkIfValue)) {
        // single value
        queriesToDb.push({ q: word.normal, w: 1, s: word.text, a: false });
      } else {
        // all others
        queriesToDb.push({ q: word.normal, w: 1, s: word.text, a: true });
      }
    });

    // three initial ways: original query, singular query, plural query
    queriesToDb.unshift({ q: queryNlp.normalize().toLowerCase().out(),
      w: 10, s: workingQuery, a: true });
    queriesToDb.unshift({ q: queryNlp.nouns().toSingular().all().normalize().toLowerCase().out(),
      w: 10, s: workingQuery, a: true });
    queriesToDb.unshift({ q: queryNlp.nouns().toPlural().all().normalize().toLowerCase().out(),
      w: 10, s: workingQuery, a: true });
  }

  // queries are ready, now it's time to filter out duplications
  queriesToDb = queriesToDb.filter(function (a) {
    // eslint-disable-next-line no-return-assign
    return !this[a.q] && (this[a.q] = true);
  }, Object.create(null));

  return queriesToDb;
};

function populateNounToForms(noun) {
  if (noun.length > 2) {
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
    if (lastCase === 'a' && noun.charAt(noun.length - 2) === 'v') {
      // supernova -> supernovae
      toReturn.push(noun + 'e');
    } else if (lastCase === 'e' && noun.charAt(noun.length - 2) === 'a') {
      // supernovae -> supernov processed
      processedNoun = noun.substring(0, noun.length - 2);
      toReturn.push(processedNoun + 'a');
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
  return [noun + 's'];
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
