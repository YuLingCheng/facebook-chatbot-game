const axios = require('axios');
const mongojs = require('mongojs');

const scrib = require('./scrib.js');
const emojis = require('../resources/emojis.json');
const greetings = ['Hello', 'Bonjour', 'Salut'];

const pageUrl = `https://graph.facebook.com/v2.6/me/messages?access_token=${process.env.FB_PAGE_ACCESS_TOKEN}`;

const mongoUri = 'mongodb://yuling:yuling-bot@ds141328.mlab.com:41328/chatbot';
const db = mongojs(mongoUri);

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

const sendQuestion = function (senderId, randomPerson, cheer) {
  const randomEmoji = emojis.happy[Math.floor(Math.random() * emojis.happy.length)];
  const randGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  var promise = sendMessage(
    senderId,
    scrib.getImageMsg(randomPerson.img)
  );
  sendMessage(
    senderId,
    scrib.getMsgWithButtons(
      (cheer? `Bravo ${String.fromCodePoint(randomEmoji)} ! ` : '' )+ `${randGreeting}...`,
      [
        scrib.getButton('Voir la réponse', 'ANSWER'),
        scrib.getButton('Indice', 'HINT')
      ]
    )
  );
  return promise;
};

const generateQuestion = function (senderId, time, cheer) {

  db.collection('people').find({}, function(err, people) {
    db.collection('records')
      .find({senderId: senderId})
      .sort({score: 1})
      .toArray(function(err, records) {
        // find people that are not in the records yet
        recordKeyList = records.map(function(record) {
          return record.key;
        });
        peopleKeyList = people.map(function(person) {
          return person.key;
        });
        list = people.filter(function(person) {
          return recordKeyList.indexOf(person.key) < 0;
        });

        // if they are all in the records get the ones with lowest scores
        // excluding people that left and aren't in peopleKeyList anymore
        if (list.length === 0) {
          const minScore = records[0].score;
          const minScoreKeyList = records.filter(function(record) {
            return peopleKeyList.indexOf(record.key) >= 0 && record.score <= minScore+1.5;
          }).map(function(record) {
            return record.key;
          });
          list = people.filter(function(person) {
            return minScoreKeyList.indexOf(person.key) >= 0;
          });

          // get a random person out of the list
          randomIndex = Math.floor(Math.random() * list.length);
          randomPerson = list[randomIndex];

          // update records with new question time
          db.collection('records').update(
            {
              senderId: senderId,
              key: randomPerson.key
            },
            {
              $set: { time: time }
            }, function () {
              db.close();
              return sendQuestion(senderId, randomPerson, cheer);
            }
          );
        } else {
          // get a random person out of the list
          randomIndex = Math.floor(Math.random() * list.length);
          randomPerson = list[randomIndex];

          // insert a new record
          db.collection('records').insert(
            {
              key: randomPerson.key,
              firstname: randomPerson.firstname,
              score: 0,
              senderId: senderId,
              time: time
            }, function () {
              db.close();
              return sendQuestion(senderId, randomPerson, cheer);
            }
          );
        }
      });
  });
};

const sendAnswer = function (senderId) {
  const randomEmoji = emojis.happy[Math.floor(Math.random() * emojis.happy.length)];
  db.collection('records')
    .find({senderId: senderId})
    .sort({time: -1})
    .limit(1)
    .toArray(function(err, result) {
      if (err || result.length <= 0 || !result[0].hasOwnProperty("key")) {
        db.close();
        throw new Error();
      }
      // update score
      db.collection('records').update(
        { senderId: senderId, key: result[0].key },
        { $inc: { score: -0.5 } }, function () {
        db.close();

        return sendMessage(
          senderId,
          scrib.getMsgWithButtons(
            `C'est ${result[0].firstname} ${String.fromCodePoint(randomEmoji)}`,
            [scrib.getButton('Rejouer', 'INIT_PLAY')]
          )
        );
      });
    });
};

const sendResponseToAnswer = function (senderId, success, personKey, time) {
  const randomEmoji = emojis.happy[Math.floor(Math.random() * emojis.happy.length)];
  var message, buttons;
  if (success) {
    // update score
    db.collection('records').update(
      { senderId: senderId, key: personKey },
      { $inc: { score: 1 } }, function (err, result) {
        return generateQuestion(senderId, time, true);
      }
    );
  } else {
    // update score
    db.collection('records')
      .find({senderId: senderId})
      .sort({time: -1})
      .limit(1)
      .toArray(function(err, result) {
        if (err || result.length <= 0 || !result[0].hasOwnProperty("key")) {
          db.close();
          throw new Error();
        }
        db.collection('records').update(
          { senderId: senderId, key: result[0].key },
          { $inc: { score: -0.2 } }, function () {
            db.close();
            message = `Essaye encore ${String.fromCodePoint(randomEmoji)}`;
            buttons = [
              scrib.getButton('Un indice !', `HINT`),
              scrib.getButton('La réponse', `ANSWER`)
            ];

            return sendMessage(
              senderId,
              scrib.getMsgWithButtons(message, buttons)
            );
          }
        );
      });
  }
};

const sendHint = function (senderId) {
  db.collection('records')
    .find({senderId: senderId})
    .sort({time: -1})
    .limit(1)
    .toArray(function(err, result) {
      if (err || result.length <= 0 || !result[0].hasOwnProperty("key")) {
        db.close();
        throw new Error();
      }
      // update score
      db.collection('records').update(
        { senderId: senderId, key: result[0].key },
        { $inc: { score: -0.1 } }, function (err) {
          db.close();

          return sendMessage(
            senderId,
            scrib.getMsgWithButtons(
              `${result[0].key.substring(0,1).toUpperCase()}...`,
              [scrib.getButton('Voir la réponse', `ANSWER`)]
            )
          );
        }
      );
    });
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
      'Dire bonjour à ses collègues avec leur prénom ça fait toujours marquer des points !\nLa liste se trouve ici : http://www.theodo.fr/fr/theodo/les-theodoers \n"Play" pour commencer une série\n"Indice" pour un petit coup de pouce\n"Stats" pour le score',
      [scrib.getQuickReply('C\'est parti !', 'INIT_PLAY')]
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
  if (action == 'ANSWER') {
    return sendAnswer(senderId);
  } else if (action == 'HINT') {
    return sendHint(senderId);
  } else {
    switch (action) {
      case 'INIT_PLAY':
        return generateQuestion(senderId, time);
      case 'INIT_HELP':
        return sendHelpMessage(senderId);
      default:
        return sendInitMessage(senderId);
    }
  }
};

const sendScore = function(senderId) {
  db.collection('records').find({senderId: senderId}).sort({score: 1}).toArray(function(err, records) {
    const negativeRecords = records.filter(function(record) { return record.score <= 0; });
    const negativeQuota = negativeRecords.length;
    const negativeScore = negativeRecords.map(function(record) {
      return record.score;
    }).reduce(function(score1, score2) {
      return score1 + score2;
    }, 0);
    const positiveRecords = records.filter(function(record) { return record.score > 0; });
    const positiveQuota = positiveRecords.length;
    const positiveScore = positiveRecords.map(function(record) {
      return record.score;
    }).reduce(function(score1, score2) {
      return score1 + score2;
    }, 0);
    db.collection('people').find({}, function(err, people) {
      db.close();

      const score = ((negativeScore + positiveScore)*100/(positiveQuota+negativeQuota)).toFixed(2);
      scoreEmoji = '0x1F631';
      if (score >= 0 && score < 25) {
        scoreEmoji = '0x1F648';
      } else if (score >= 25 && score < 50) {
        scoreEmoji = '0x1F64A';
      } else if (score >= 50 && score < 75) {
        scoreEmoji = '0x1F64B';
      } else if (score >= 75 && score < 100) {
        scoreEmoji = '0x1F64C';
      } else if (score >= 100) {
        scoreEmoji = '0x1F680';
      }
      const coverage = ((negativeQuota+positiveQuota)*100/people.length).toFixed(2);
      if (coverage >= 0 && coverage < 25) {
        coverageEmoji = '0x1F423';
      } else if (coverage >= 25 && coverage < 50) {
        coverageEmoji = '0x1F425';
      } else if (coverage >= 50 && coverage < 75) {
        coverageEmoji = '0x1F414';
      } else if (coverage >= 75 && coverage < 100) {
        coverageEmoji = '0x1F44C';
      } else if (coverage >= 100) {
        coverageEmoji = '0x1F44F';
      }

      return sendMessage(
        senderId,
        { "text": `Score : ${score}% ${String.fromCodePoint(scoreEmoji)}\nCoverage: ${coverage}% ${String.fromCodePoint(coverageEmoji)}` }
      );
    });
  });
};

module.exports = {
  generateQuestion: generateQuestion,
  handleAction: handleAction,
  notifyProcessing: notifyProcessing,
  sendPuzzledApology: sendPuzzledApology,
  sendHelpMessage: sendHelpMessage,
  sendHint: sendHint,
  sendInitMessage: sendInitMessage,
  sendAnswer: sendAnswer,
  sendScore: sendScore,
  sendQuestion: sendQuestion,
  sendResponseToAnswer: sendResponseToAnswer
};
