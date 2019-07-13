/* eslint-disable no-param-reassign */

const striptags = require('striptags');
const relativeWeightModule = require('./relative-weights');

exports.provideResults = function (properArray, resultsMap, listOfWords, numberOfWords) {
  return properArray.map((value) => {
    const untitle = correctScreamingTitle(
      unescape(value.title)
        .replace(RegExp('\\. \\(arXiv:.*\\)'), '')
        .replace(/\\'/, "'"),
    );
    value.title = strongifyTitle(untitle, listOfWords).replace(/\<\/\d\i\v\>/g, '');
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
    value.weight = resultsMap.get(parseInt(value.id, 10));
    value.relativeWeight = relativeWeightModule.calculate(value.weight, numberOfWords);
    return value;
  });
};

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
      pos1 = lower.indexOf(' ' + word);
      toAdd = 1;
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
      pos1 = lower.indexOf(' ' + word);
      toAdd = 1;
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
