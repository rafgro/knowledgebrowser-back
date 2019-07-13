exports.calculate = function (originalWeight, noOfWords) {
  switch (noOfWords) {
    case 1:
      if (originalWeight > 125) return 9;
      if (originalWeight > 115) return 8;
      if (originalWeight > 90) return 7;
      if (originalWeight > 70) return 6;
      if (originalWeight > 50) return 5;
      if (originalWeight > 25) return 4;
      if (originalWeight > 12) return 3;
      if (originalWeight > 7) return 2;
      return 1;
    case 2:
      if (originalWeight > 190) return 10;
      if (originalWeight > 170) return 9;
      if (originalWeight > 145) return 8;
      if (originalWeight > 110) return 7;
      if (originalWeight > 105) return 6;
      if (originalWeight > 90) return 5;
      if (originalWeight > 65) return 4;
      if (originalWeight > 35) return 3;
      if (originalWeight > 20) return 2;
      return 1;
    case 3:
      if (originalWeight > 170) return 10;
      if (originalWeight > 120) return 9;
      if (originalWeight > 115) return 8;
      if (originalWeight > 110) return 7;
      if (originalWeight > 100) return 6;
      if (originalWeight > 90) return 5;
      if (originalWeight > 84) return 4;
      if (originalWeight > 60) return 3;
      if (originalWeight > 40) return 2;
      return 1;
    case 4:
      if (originalWeight > 150) return 10;
      if (originalWeight > 130) return 9;
      if (originalWeight > 120) return 8;
      if (originalWeight > 110) return 7;
      if (originalWeight > 100) return 6;
      if (originalWeight > 90) return 5;
      if (originalWeight > 84) return 4;
      if (originalWeight > 65) return 3;
      if (originalWeight > 50) return 2;
      return 1;
    default:
      if (originalWeight > 160 + (noOfWords - 4) * 10) return 10;
      if (originalWeight > 140 + (noOfWords - 4) * 10) return 9;
      if (originalWeight > 130 + (noOfWords - 4) * 10) return 8;
      if (originalWeight > 120 + (noOfWords - 4) * 10) return 7;
      if (originalWeight > 110 + (noOfWords - 4) * 10) return 6;
      if (originalWeight > 100 + (noOfWords - 4) * 10) return 5;
      if (originalWeight > 90 + (noOfWords - 4) * 10) return 4;
      if (originalWeight > 65 + (noOfWords - 4) * 10) return 3;
      if (originalWeight > 50 + (noOfWords - 4) * 10) return 2;
      return 1;
  }
};

exports.theLimit = function (noOfWords, minRelevance) {
  switch (noOfWords) {
    case 1:
      if (minRelevance >= 9) return 125;
      if (minRelevance >= 8) return 115;
      if (minRelevance >= 7) return 90;
      if (minRelevance >= 6) return 70;
      if (minRelevance >= 5) return 50;
      if (minRelevance >= 4) return 25;
      if (minRelevance >= 3) return 12;
      return 7;
    case 2:
      if (minRelevance >= 10) return 190;
      if (minRelevance >= 9) return 170;
      if (minRelevance >= 8) return 145;
      if (minRelevance >= 7) return 110;
      if (minRelevance >= 6) return 105;
      if (minRelevance >= 5) return 90;
      if (minRelevance >= 4) return 65;
      if (minRelevance >= 3) return 35;
      return 20;
    case 3:
      if (minRelevance >= 10) return 170;
      if (minRelevance >= 9) return 120;
      if (minRelevance >= 8) return 115;
      if (minRelevance >= 7) return 110;
      if (minRelevance >= 6) return 100;
      if (minRelevance >= 5) return 90;
      if (minRelevance >= 4) return 84;
      if (minRelevance >= 3) return 60;
      return 40;
    case 4:
      if (minRelevance >= 10) return 150;
      if (minRelevance >= 9) return 130;
      if (minRelevance >= 8) return 120;
      if (minRelevance >= 7) return 110;
      if (minRelevance >= 6) return 100;
      if (minRelevance >= 5) return 90;
      if (minRelevance >= 4) return 84;
      if (minRelevance >= 3) return 65;
      return 50;
    default:
      if (minRelevance >= 10) return 160 + (noOfWords - 4) * 10;
      if (minRelevance >= 9) return 140 + (noOfWords - 4) * 10;
      if (minRelevance >= 8) return 130 + (noOfWords - 4) * 10;
      if (minRelevance >= 7) return 120 + (noOfWords - 4) * 10;
      if (minRelevance >= 6) return 110 + (noOfWords - 4) * 10;
      if (minRelevance >= 5) return 100 + (noOfWords - 4) * 10;
      if (minRelevance >= 4) return 90 + (noOfWords - 4) * 10;
      if (minRelevance >= 3) return 65 + (noOfWords - 4) * 10;
      return 50 + (noOfWords - 4) * 10;
  }
};
