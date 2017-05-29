'use strict';
const mongojs = require('mongojs');

const referee = require('./lib/referee.js');
const textProcessor = require('./lib/textProcessor.js');

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
          referee.handleAction(messagingItem.postback.payload, senderId, entry.time);

        // handle text message
        } else if (messagingItem.message) {
          referee.notifyProcessing(senderId);
          const msg = messagingItem.message;

          // handle quick message
          if (msg.quick_reply && msg.quick_reply.payload) {
            console.log(`handle quick msg ${msg.quick_reply.payload}`);
            referee.handleAction(msg.quick_reply.payload, senderId, entry.time);

          // handle any text message
        } else if (msg.text) {
            var text = msg.text;

            // handle play request
            if (textProcessor.isPlayCommand(text)) {
              console.log('handle play request');
              referee.generateQuestion(senderId, entry.time);

            // handle help request
            } else if (textProcessor.isHelpCommand(text)) {
              console.log('handle help request');
              referee.sendHelpMessage(senderId, entry.time);

            // handle hint request
            } else if (textProcessor.isHintCommand(text)) {
              console.log('handle hint request');
              referee.sendHint(senderId);

            // handle score request
            } else if (textProcessor.isScoreCommand(text)) {
              console.log('handle score request');
              referee.sendScore(senderId);

            // handle unknown text
            } else if (!textProcessor.isName(text)) {
              console.log('Unknown text');
              referee.sendPuzzledApology(senderId);

            } else {
              const db = mongojs(process.env.MONGO_URI);
              db.collection('records')
                .find({senderId: senderId})
                .sort({time: -1})
                .limit(1)
                .toArray(function(err, result) {
                  if (err) throw err;

                  // handle answer to question
                  if (result.length === 1) {
                    // get expectedAnswer
                    const expectedAnswer = result[0].firstname;
                    const personKey = result[0].key

                    if (textProcessor.isRightAnswer(text, expectedAnswer)) {
                      console.log('Success');
                      referee.sendResponseToAnswer(senderId, true, personKey, entry.time+1);
                    } else {
                      console.log('Failure');
                      referee.sendResponseToAnswer(senderId, false, personKey, entry.time+1);
                    }

                  // handle message that is not recognized
                  } else {
                    console.log('could not handle message');
                    referee.sendInitMessage(senderId);
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
