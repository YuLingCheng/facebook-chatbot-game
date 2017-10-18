'use strict'

const recordsResource = require('./resources/recordsResource.js')
const responseManager = require('./services/responseManager.js')
const gameMaster = require('./services/gameMaster.js')
const chatbot = require('./services/chatbot.js')
const textProcessor = require('./services/textProcessor.js')

module.exports.webhook = (event, context, callback) => {
  if (event.method === 'GET') {
    // facebook app verification
    if (event.query['hub.verify_token'] === process.env.FB_APP_TOKEN && event.query['hub.challenge']) {
      return callback(null, parseInt(event.query['hub.challenge']))

    } else {
      return callback(new Error('[403] Invalid token'))
    }
  }

  if (event.method === 'POST') {
    event.body.entry.map((entry) => {
      entry.messaging.map((messagingItem) => {
        const senderId = messagingItem.sender.id;

        // handle button action
        if (messagingItem.postback && messagingItem.postback.payload) {
          handleAction(senderId, messagingItem.postback.payload, entry.time).then(() => {
            return callback(null, responseManager.get(200, `Handle ${messagingItem.postback.payload}`, event))
          }).catch((err) => {
            return callback(err)
          })

        // handle text message
        } else if (messagingItem.message) {
          chatbot.notifyProcessing(senderId)
          const msg = messagingItem.message

          // handle quick message
          if (msg.quick_reply && msg.quick_reply.payload) {
            handleAction(senderId, msg.quick_reply.payload, entry.time).then(() => {
              return callback(null, responseManager.get(200, `Handle ${msg.quick_reply.payload}`, event))
            }).catch((err) => {
              return callback(err)
            })

          // handle any text message
        } else if (msg.text) {
            const text = msg.text

            // handle play request
            if (textProcessor.isPlayCommand(text)) {
              return gameMaster.generateQuestion(
                senderId,
                entry.time
              ).then(question => {
                return chatbot.sendQuestion(senderId, question)
              }).then(() => {
                return callback(null, responseManager.get(200, 'Handle play request', event))
              }).catch((err) => {
                return callback(err)
              })

            // handle help request
            } else if (textProcessor.isHelpCommand(text)) {
              chatbot.sendHelpMessage(senderId).then(() => {
                return callback(null, responseManager.get(200, 'Handle help request', event))
              }).catch((err) => {
                return callback(err)
              })

            // handle hint request
            } else if (textProcessor.isHintCommand(text)) {
              recordsResource.findLastBySenderId(senderId).then(lastRecord => {
                const personKey = lastRecord.key
                return Promise.all([
                  gameMaster.updateScore(senderId, personKey, 'hint'),
                  chatbot.sendHint(senderId, personKey)
                ])
              }).then(() => {
                return callback(null, responseManager.get(200, 'Handle hint request', event))
              }).catch((err) => {
                return callback(err)
              })

            // handle score request
            } else if (textProcessor.isScoreCommand(text)) {
              gameMaster.computeScore(senderId).then(scoreValues => {
                return chatbot.sendScore(senderId, scoreValues)
              }).then(() => {
                return callback(null, responseManager.get(200, 'Handle score request', event))
              }).catch((err) => {
                return callback(err)
              })
              // referee.sendScore(senderId);

            // handle unknown text
            } else if (!textProcessor.isName(text)) {
              chatbot.sendPuzzledApology(senderId).then(() => {
                return callback(null, responseManager.get(200, 'Unknown text', event))
              }).catch((err) => {
                return callback(err)
              })

            } else {
              recordsResource.findLastBySenderId(senderId).then(lastRecord => {
                if (lastRecord) {
                  const isSuccess = gameMaster.processAnswer(lastRecord, text)
                  const personKey = lastRecord.key
                  const answerType = isSuccess ? 'right' : 'wrong'
                  gameMaster.updateScore(senderId, personKey, answerType).then(() => {
                    if (isSuccess) {
                      return gameMaster.generateQuestion(senderId, entry.time).then(question => {
                        return chatbot.sendQuestion(senderId, question, true)
                      })
                    } else {
                      return chatbot.sendResponseToBadAnswer(senderId)
                    }
                  }).then(() => {
                    return callback(null, responseManager.get(200, 'Handle answer request', event))
                  }).catch((err) => {
                    return callback(err)
                  })
                } else {
                  chatbot.sendInitMessage(senderId).then(() => {
                    return callback(null, responseManager.get(200, 'No question asked', event))
                  }).catch((err) => {
                    return callback(err)
                  })
                }
              })
            }
          }
        }
      })
    })
  } else {
    return callback(null, responseManager.get(400, 'Bad Request', event))
  }
}

const handleAction = (senderId, action, time) => {
  switch (action) {
    case 'ANSWER':
      return recordsResource.findLastBySenderId(senderId).then(lastRecord => {
        return Promise.all([
          gameMaster.updateScore(senderId, lastRecord.key, 'drop'),
          chatbot.sendAnswer(senderId, lastRecord.firstname)
        ])
      })
    case 'HINT':
      return recordsResource.findLastBySenderId(senderId).then(lastRecord => {
        const personKey = lastRecord.key
        return Promise.all([
          gameMaster.updateScore(senderId, personKey, 'hint'),
          chatbot.sendHint(senderId, personKey)
        ])
      })
    case 'SCORE':
      return gameMaster.computeScore(senderId).then(scoreValues => {
        return chatbot.sendScore(senderId, scoreValues)
      })
    case 'INIT_PLAY':
      return gameMaster.generateQuestion(senderId, time).then(question => {
        return chatbot.sendQuestion(senderId, question)
      })
    case 'INIT_HELP':
      return chatbot.sendHelpMessage(senderId)
    default:
      return chatbot.sendInitMessage(senderId)
  }
}
