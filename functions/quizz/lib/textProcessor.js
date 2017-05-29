const stripAccents = function (text) {
  var rExps=[
  {re:/[\xC0-\xC6]/g, ch:'A'},
  {re:/[\xE0-\xE6]/g, ch:'a'},
  {re:/[\xC8-\xCB]/g, ch:'E'},
  {re:/[\xE8-\xEB]/g, ch:'e'},
  {re:/[\xCC-\xCF]/g, ch:'I'},
  {re:/[\xEC-\xEF]/g, ch:'i'},
  {re:/[\xD2-\xD6]/g, ch:'O'},
  {re:/[\xF2-\xF6]/g, ch:'o'},
  {re:/[\xD9-\xDC]/g, ch:'U'},
  {re:/[\xF9-\xFC]/g, ch:'u'},
  {re:/[\xD1]/g, ch:'N'},
  {re:/[\xF1]/g, ch:'n'} ];

  for (var i = 0; i < rExps.length; i++) {
    text = text.replace(rExps[i].re, rExps[i].ch);
  }

  return text;
};

const preprocessText = function (text) {
  var lowercaseText = text.toLowerCase();
  var plainText = stripAccents(lowercaseText);
  var preprocessedText = plainText.replace('-', ' ');

  return {
    stemmedText: preprocessedText,
    wordCount: preprocessedText.trim().split(/\s+/).length
  };
};

const isPlayCommand = function (text) {
  return ['jouer', 'play', 'rejouer'].indexOf(preprocessText(text).stemmedText) > -1;
};

const isHelpCommand = function (text) {
  return ['aide', 'help', '?'].indexOf(preprocessText(text).stemmedText) > -1;
};

const isScoreCommand = function (text) {
  return ['score', 'stats'].indexOf(preprocessText(text).stemmedText) > -1;
};

const isHintCommand = function (text) {
  return ['indice', 'hint'].indexOf(preprocessText(text).stemmedText) > -1;
};

const isName = function (text) {
  return preprocessText(text).wordCount <= 3;
};

const isRightAnswer = function (text, answer) {
  return preprocessText(text).stemmedText === preprocessText(answer).stemmedText;
};

module.exports = {
  isHelpCommand: isHelpCommand,
  isHintCommand: isHintCommand,
  isName: isName,
  isPlayCommand: isPlayCommand,
  isRightAnswer: isRightAnswer,
  isScoreCommand: isScoreCommand,
};
