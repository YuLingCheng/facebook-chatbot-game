'use strict';

var stripAccents = function stripAccents(text) {
  var rExps = [{ re: /[\xC0-\xC6]/g, ch: 'A' }, { re: /[\xE0-\xE6]/g, ch: 'a' }, { re: /[\xC8-\xCB]/g, ch: 'E' }, { re: /[\xE8-\xEB]/g, ch: 'e' }, { re: /[\xCC-\xCF]/g, ch: 'I' }, { re: /[\xEC-\xEF]/g, ch: 'i' }, { re: /[\xD2-\xD6]/g, ch: 'O' }, { re: /[\xF2-\xF6]/g, ch: 'o' }, { re: /[\xD9-\xDC]/g, ch: 'U' }, { re: /[\xF9-\xFC]/g, ch: 'u' }, { re: /[\xD1]/g, ch: 'N' }, { re: /[\xF1]/g, ch: 'n' }];

  for (var i = 0; i < rExps.length; i++) {
    text = text.replace(rExps[i].re, rExps[i].ch);
  }

  return text;
};

var preprocessText = function preprocessText(text) {
  var lowercaseText = text.toLowerCase();
  var plainText = stripAccents(lowercaseText);
  var preprocessedText = plainText.replace('-', ' ');

  return {
    stemmedText: preprocessedText,
    wordCount: preprocessedText.trim().split(/\s+/).length
  };
};

var isPlayCommand = function isPlayCommand(text) {
  return ['jouer', 'play', 'rejouer', 'j', 'p'].indexOf(preprocessText(text).stemmedText) > -1;
};

var isHelpCommand = function isHelpCommand(text) {
  return ['aide', 'help', '?', 'h'].indexOf(preprocessText(text).stemmedText) > -1;
};

var isScoreCommand = function isScoreCommand(text) {
  return ['score', 'stats', 's'].indexOf(preprocessText(text).stemmedText) > -1;
};

var isHintCommand = function isHintCommand(text) {
  return ['indice', 'hint', 'i'].indexOf(preprocessText(text).stemmedText) > -1;
};

var isAnswerCommand = function isAnswerCommand(text) {
  return ['réponse', 'answer', 'r', 'a'].indexOf(preprocessText(text).stemmedText) > -1;
};

var isName = function isName(text) {
  return preprocessText(text).wordCount <= 2;
};

var isRightAnswer = function isRightAnswer(text, answer) {
  return preprocessText(text).stemmedText === preprocessText(answer).stemmedText;
};

module.exports = {
  isHelpCommand: isHelpCommand,
  isHintCommand: isHintCommand,
  isAnswerCommand: isAnswerCommand,
  isName: isName,
  isPlayCommand: isPlayCommand,
  isRightAnswer: isRightAnswer,
  isScoreCommand: isScoreCommand
};
