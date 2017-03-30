const axios = require('axios');
const mongojs = require('mongojs');

const scrib = require('./scrib.js');

const emojis = require('../resources/emojis.json');
const teamList = require('../resources/team.json');
const photos = Object.keys(teamList);

const pageUrl = `https://graph.facebook.com/v2.6/me/messages?access_token=${process.env.FB_PAGE_ACCESS_TOKEN}`;

const mongoUri = 'mongodb://yuling:yuling-bot@ds141328.mlab.com:41328/chatbot';

const notifyProcessing = function (senderId) {
  return axios.post(
    pageUrl,
    {
      recipient: {
        id: senderId
      },
      sender_action: 'typing_on'
    }
  );
};

const sendMessage = function (senderId, messageObject) {
  return axios.post(
    pageUrl,
    {
      recipient: {
        id: senderId
      },
      message: messageObject
    }
  );
};

const saveQuestionToDb = function (senderId, answer, time) {
  var question = {
    senderId: senderId,
    answer: answer,
    time: time
  };
  const db = mongojs(mongoUri);
  const questions = db.collection('questions');
  questions.insert(question, function(err, result) {
    if (err) throw err;
    console.log(`insert question senderId: ${senderId}, answer: ${answer}, time: ${time}`);
    db.close();
  });
};

const sendQuestion = function (senderId, time) {
  const randomPerson = photos[Math.floor(Math.random() * photos.length)];
  saveQuestionToDb(senderId, teamList[randomPerson], time);
  var promise = sendMessage(
    senderId,
    scrib.getImageMsg(randomPerson)
  );
  sendMessage(
    senderId,
    scrib.getMsgWithButtons(
      'Qui est-ce ? (prénom)',
      [
        scrib.getButton('Voir la réponse', `ANSWER_${randomPerson}`),
        scrib.getButton('Indice', `HINT_${randomPerson}`)
      ]
    )
  );
  return promise;
};

const sendAnswer = function (senderId, name) {
  const randomEmoji = emojis.happy[Math.floor(Math.random() * emojis.happy.length)];
  return sendMessage(
    senderId,
    scrib.getMsgWithButtons(
      `C'est ${name} ` + String.fromCodePoint(randomEmoji),
      [scrib.getButton('Rejouer', 'INIT_PLAY')]
    )
  );
};

const sendResponseToAnswer = function (senderId, success, personKey, time) {
  const randomEmoji = emojis.happy[Math.floor(Math.random() * emojis.happy.length)];
  var message, buttons;
  if (success) {
    message = 'Bravo '+ String.fromCodePoint(randomEmoji) + '!';

    return sendQuestion(senderId, time);
  } else {
    message = 'Essaye encore '+ String.fromCodePoint(randomEmoji);
    buttons = [
      scrib.getButton('Un indice !', `HINT_${personKey}`),
      scrib.getButton('La réponse', `ANSWER_${personKey}`)
    ];

    return sendMessage(
      senderId,
      scrib.getMsgWithButtons(message, buttons)
    );
  }
};

const sendHint = function (senderId, name, photo) {
  return sendMessage(
    senderId,
    scrib.getMsgWithButtons(
      `${name.substring(0,1)}...`,
      [scrib.getButton('Voir la réponse', `ANSWER_${photo}`)]
    )
  );
};

const sendPuzzledApology = function(senderId) {
  return sendMessage(
    senderId,
    scrib.getMsgWithHelpers(
      'Hum, j\'ai peur de ne pas comprendre',
      [scrib.getQuickReply('À l\'aide !', 'INIT_HELP')]
    )
  );
};

const sendHelpMessage = function(senderId) {
  return sendMessage(
    senderId,
    scrib.getMsgWithHelpers(
      'Apprends à connaître le nom des Theodoers; je te montre une photo et tu me donnes son prénom. La liste se trouve ici : http://www.theodo.fr/fr/theodo/les-theodoers',
      [scrib.getQuickReply('J\'ai compris', 'INIT_PLAY')]
    )
  );
};

const sendInitMessage = function(senderId) {
  return sendMessage(
    senderId,
    scrib.getMsgWithHelpers(
      'Que veux-tu faire ?',
      [
        scrib.getQuickReply('Jouer', 'INIT_PLAY'),
        scrib.getQuickReply('Aide', 'INIT_HELP')
      ]
    )
  );
};

const handleAction = function(action, senderId, time) {
  var personKey;
  if (action.startsWith('ANSWER_')) {
    personKey = action.substring('ANSWER_'.length);
    if (teamList.hasOwnProperty(personKey)) {
      return sendAnswer(senderId, teamList[personKey]);
    }
  } else if (action.startsWith('HINT_')) {
    personKey = action.substring('HINT_'.length);
    if (teamList.hasOwnProperty(personKey)) {
      return sendHint(senderId, teamList[personKey], personKey);
    }
  } else {
    switch (action) {
      case 'INIT_PLAY':
        return sendQuestion(senderId, time);
      case 'INIT_HELP':
        return sendHelpMessage(senderId);
      default:
        return sendInitMessage(senderId);
    }
  }
};

module.exports = {
  handleAction: handleAction,
  notifyProcessing: notifyProcessing,
  sendPuzzledApology: sendPuzzledApology,
  sendHelpMessage: sendHelpMessage,
  sendHint: sendHint,
  sendInitMessage: sendInitMessage,
  sendQuestion: sendQuestion,
  sendResponseToAnswer: sendResponseToAnswer
};
