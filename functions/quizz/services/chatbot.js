'use strict';

var axios = require('axios');

var secretary = require('./secretary.js');
var listManager = require('./listManager.js');
var emojis = require('../assets/emojis.json');
var greetings = ['Hello', 'Bonjour', 'Salut'];

var pageUrl = 'https://graph.facebook.com/v2.6/me/messages?access_token=' + process.env.FB_PAGE_ACCESS_TOKEN;

var sendMessage = function sendMessage(senderId, messageObject) {
  return axios.post(pageUrl, {
    recipient: {
      id: senderId
    },
    message: messageObject
  });
};

var notifyProcessing = function notifyProcessing(senderId) {
  return axios.post(pageUrl, {
    recipient: {
      id: senderId
    },
    sender_action: 'typing_on'
  });
};

var sendQuestion = function sendQuestion(senderId, randomPerson, cheer) {
  var randomEmoji = listManager.getRandomItem(emojis.happy);
  var randGreeting = listManager.getRandomItem(greetings);
  return sendMessage(senderId, secretary.getImageMsg(randomPerson.img)).then(function () {
    return sendMessage(senderId, secretary.getMsgWithButtons((cheer ? 'Bravo ' + String.fromCodePoint(randomEmoji) + ' ! ' : '') + (randGreeting + '...?'), [secretary.getButton('Voir la réponse', 'ANSWER'), secretary.getButton('Indice', 'HINT')]));
  }).catch(function (err) {
    return err;
  });
};

var sendResponseToBadAnswer = function sendResponseToBadAnswer(senderId) {
  var randomEmoji = listManager.getRandomItem(emojis.happy);
  var message = 'Essaye encore ' + String.fromCodePoint(randomEmoji);
  var buttons = [secretary.getButton('Un indice !', 'HINT'), secretary.getButton('La réponse', 'ANSWER')];
  return sendMessage(senderId, secretary.getMsgWithButtons(message, buttons));
};

var sendAnswer = function sendAnswer(senderId, firstname) {
  var randomEmoji = listManager.getRandomItem(emojis.happy);
  return sendMessage(senderId, secretary.getMsgWithButtons('C\'est ' + firstname + ' ' + String.fromCodePoint(randomEmoji), [secretary.getButton('Rejouer', 'INIT_PLAY'), secretary.getButton('Score', 'SCORE')]));
};

var sendHint = function sendHint(senderId, personKey) {
  return sendMessage(senderId, secretary.getMsgWithButtons(personKey.substring(0, 1).toUpperCase() + '...', [secretary.getButton('Voir la réponse', 'ANSWER'), secretary.getButton('Score', 'SCORE')]));
};

var sendPuzzledApology = function sendPuzzledApology(senderId) {
  return sendMessage(senderId, secretary.getMsgWithHelpers('Hum, j\'ai peur de ne pas comprendre', [secretary.getQuickReply('À l\'aide !', 'INIT_HELP')]));
};

var sendHelpMessage = function sendHelpMessage(senderId) {
  return sendMessage(senderId, secretary.getMsgWithHelpers('Dire bonjour à ses collègues avec leur prénom ça fait toujours marquer des points !\nLa liste se trouve ici : http://www.theodo.fr/fr/theodo/les-theodoers \n"Play" pour commencer une série\n"Indice" pour un petit coup de pouce\n"Stats" pour le score', [secretary.getQuickReply('C\'est parti !', 'INIT_PLAY')]));
};

var sendInitMessage = function sendInitMessage(senderId) {
  return sendMessage(senderId, secretary.getMsgWithHelpers('Que veux-tu faire ?', [secretary.getQuickReply('Jouer', 'INIT_PLAY'), secretary.getQuickReply('Aide', 'INIT_HELP')]));
};

var sendScore = function sendScore(senderId, scoreValues) {
  return sendMessage(senderId, { text: 'Score : ' + scoreValues.score.value + '% ' + String.fromCodePoint(scoreValues.score.emoji) + '\nCoverage: ' + scoreValues.coverage.value + '% ' + String.fromCodePoint(scoreValues.coverage.emoji) });
};

module.exports = {
  notifyProcessing: notifyProcessing,
  sendAnswer: sendAnswer,
  sendHelpMessage: sendHelpMessage,
  sendHint: sendHint,
  sendInitMessage: sendInitMessage,
  sendPuzzledApology: sendPuzzledApology,
  sendQuestion: sendQuestion,
  sendResponseToBadAnswer: sendResponseToBadAnswer,
  sendScore: sendScore
};
