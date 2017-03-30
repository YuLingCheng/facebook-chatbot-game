'use strict';
const mongojs = require('mongojs');

const bot = require('./lib/messenger.js');
const textProcessor = require('./lib/textProcessor.js');

const teamList = require('./resources/team.json');
const photos = Object.keys(teamList);

module.exports.webhook = (event, context, callback) => {
  if (event.method === 'GET') {
    // facebook app verification
    if (event.query['hub.verify_token'] === process.env.FB_APP_TOKEN && event.query['hub.challenge']) {
      return callback(null, parseInt(event.query['hub.challenge']));

    } else {
      return callback(new Error('[403] Invalid token'));
    }
  }

  if (event.method === 'POST') {
    event.body.entry.map((entry) => {
      entry.messaging.map((messagingItem) => {
        const senderId = messagingItem.sender.id;

        // handle button action
        if (messagingItem.postback && messagingItem.postback.payload) {
          console.log(`handle ${messagingItem.postback.payload}`);
          bot.handleAction(messagingItem.postback.payload, senderId, entry.time)
            .catch((error) => callback(new Error(error)));

        // handle text message
        } else if (messagingItem.message) {
          bot.notifyProcessing(senderId)
            .catch((error) => callback(new Error(error)));
          const msg = messagingItem.message;

          // handle quick message
          if (msg.quick_reply && msg.quick_reply.payload) {
            console.log(`handle quick msg ${msg.quick_reply.payload}`);
            bot.handleAction(msg.quick_reply.payload, senderId, entry.time)
              .catch((error) => callback(new Error(error)));

          // handle any text message
          } else if (msg.text) {
            var text = msg.text;

            // handle play request
            if (textProcessor.isPlayCommand(text)) {
              console.log('handle play request');
              bot.sendQuestion(senderId, entry.time)
                .catch((error) => callback(new Error(error)));

            } else {
              const db = mongojs(process.env.MONGO_URI);
              const questions = db.collection('questions');
              questions.find({senderId: senderId}).sort({time: -1}).toArray(function(err, result) {
                if (err) throw err;

                // handle answer to question
                if (result.length > 0) {
                   var expectedAnswer = result[0].answer;
                   var personKey = photos.find(key => teamList[key] === expectedAnswer);

                   // handle hint request
                   if (textProcessor.isHintCommand(text)) {
                     console.log('handle hint request');
                     bot.sendHint(senderId, expectedAnswer, personKey)
                       .catch((error) => callback(new Error(error)));

                   } else if (!textProcessor.isName(text)) {
                     console.log('Unknown text');
                     bot.sendPuzzledApology(senderId)
                       .catch((error) => callback(new Error(error)));

                   } else if (textProcessor.isRightAnswer(text, expectedAnswer)) {
                     console.log('Success');
                     bot.sendResponseToAnswer(senderId, true, personKey)
                       .then(() => bot.sendQuestion(senderId, entry.time+1))
                       .catch((error) => callback(new Error(error)));
                   } else {
                     console.log('Failure');
                     bot.sendResponseToAnswer(senderId, false, personKey)
                       .catch((error) => callback(new Error(error)));
                   }

                 // handle message that is not recognized
                } else {
                  console.log('could not handle message');
                  bot.sendInitMessage(senderId)
                    .catch((error) => callback(new Error(error)));
                }
                db.close();
              });
            }
          }
        }
      });
    });
  } else {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Bad Request',
        input: event,
      }),
    };

    return callback(null, response);
  }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
