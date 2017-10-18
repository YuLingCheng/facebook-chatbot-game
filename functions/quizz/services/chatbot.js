const axios = require('axios');

const secretary = require('./secretary.js');
const listManager = require('./listManager.js')
const emojis = require('../assets/emojis.json')
const greetings = ['Hello', 'Bonjour', 'Salut']

const pageUrl = `https://graph.facebook.com/v2.6/me/messages?access_token=${process.env.FB_PAGE_ACCESS_TOKEN}`;

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

const notifyProcessing = senderId => {
  return axios.post(
    pageUrl,
    {
      recipient: {
        id: senderId
      },
      sender_action: 'typing_on'
    }
  )
}

const sendQuestion = (senderId, randomPerson, cheer) => {
  const randomEmoji = listManager.getRandomItem(emojis.happy)
  const randGreeting = listManager.getRandomItem(greetings)
  return sendMessage(
    senderId,
    secretary.getImageMsg(randomPerson.img)
  ).then(() => {
    return sendMessage(
      senderId,
      secretary.getMsgWithButtons(
        (cheer ? `Bravo ${String.fromCodePoint(randomEmoji)} ! ` : '' ) + `${randGreeting}...?`,
        [
          secretary.getButton('Voir la réponse', 'ANSWER'),
          secretary.getButton('Indice', 'HINT')
        ]
      )
    )
  }).catch(err => { return err })
};


const sendResponseToBadAnswer = function (senderId) {
  const randomEmoji = listManager.getRandomItem(emojis.happy)
  const message = `Essaye encore ${String.fromCodePoint(randomEmoji)}`
  const buttons = [
    secretary.getButton('Un indice !', `HINT`),
    secretary.getButton('La réponse', `ANSWER`)
  ]
  return sendMessage(
    senderId,
    secretary.getMsgWithButtons(message, buttons)
  )
}

const sendAnswer = (senderId, firstname) => {
  const randomEmoji = listManager.getRandomItem(emojis.happy)
  return sendMessage(
    senderId,
    secretary.getMsgWithButtons(
      `C'est ${firstname} ${String.fromCodePoint(randomEmoji)}`,
      [
        secretary.getButton('Rejouer', 'INIT_PLAY'),
        secretary.getButton('Score', `SCORE`)
      ]
    )
  )
}

const sendHint = (senderId, personKey) => {
  return sendMessage(
    senderId,
    secretary.getMsgWithButtons(
      `${personKey.substring(0,1).toUpperCase()}...`,
      [
        secretary.getButton('Voir la réponse', `ANSWER`),
        secretary.getButton('Score', `SCORE`)
      ]
    )
  )
}

const sendPuzzledApology = senderId => {
  return sendMessage(
    senderId,
    secretary.getMsgWithHelpers(
      'Hum, j\'ai peur de ne pas comprendre',
      [secretary.getQuickReply('À l\'aide !', 'INIT_HELP')]
    )
  )
}

const sendHelpMessage = senderId => {
  return sendMessage(
    senderId,
    secretary.getMsgWithHelpers(
      'Dire bonjour à ses collègues avec leur prénom ça fait toujours marquer des points !\nLa liste se trouve ici : http://www.theodo.fr/fr/theodo/les-theodoers \n"Play" pour commencer une série\n"Indice" pour un petit coup de pouce\n"Stats" pour le score',
      [secretary.getQuickReply('C\'est parti !', 'INIT_PLAY')]
    )
  )
}

const sendInitMessage = senderId => {
  return sendMessage(
    senderId,
    secretary.getMsgWithHelpers(
      'Que veux-tu faire ?',
      [
        secretary.getQuickReply('Jouer', 'INIT_PLAY'),
        secretary.getQuickReply('Aide', 'INIT_HELP')
      ]
    )
  )
}

const sendScore = (senderId, scoreValues) => {
  return sendMessage(
    senderId,
    { text: `Score : ${scoreValues.score.value}% ${String.fromCodePoint(scoreValues.score.emoji)}\nCoverage: ${scoreValues.coverage.value}% ${String.fromCodePoint(scoreValues.coverage.emoji)}` }
  )
}

module.exports = {
  notifyProcessing,
  sendAnswer,
  sendHelpMessage,
  sendHint,
  sendInitMessage,
  sendPuzzledApology,
  sendQuestion,
  sendResponseToBadAnswer,
  sendScore
}
