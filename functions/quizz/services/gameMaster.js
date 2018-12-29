'use strict';

var secretary = require('./secretary.js');
var peopleResource = require('../resources/peopleResource.js');
var recordsResource = require('../resources/recordsResource.js');
var textProcessor = require('./textProcessor.js');
var listManager = require('./listManager.js');

var getUnknownPeople = function getUnknownPeople(records, people) {
  // find people that are not in the records yet
  var recordKeyList = records.map(function (record) {
    return record.key;
  });
  return people.filter(function (person) {
    return recordKeyList.indexOf(person.key) < 0;
  });
};

var getLeastKnownPeople = function getLeastKnownPeople(records, people) {
  var peopleKeyList = people.map(function (person) {
    return person.key;
  });
  var minScore = records[0].score;
  var minScoreKeyList = records.filter(function (record) {
    return peopleKeyList.indexOf(record.key) >= 0 && record.score <= minScore + 1.5;
  }).map(function (record) {
    return record.key;
  });
  return people.filter(function (person) {
    return minScoreKeyList.indexOf(person.key) >= 0;
  });
};

var generateQuestion = function generateQuestion(db, senderId, time) {
  // generate a question and saves it to database
  var randomPerson = void 0,
      candidateList = void 0;

  return new Promise(function (resolve, reject) {
    Promise.all([peopleResource.findAll(db), recordsResource.findBySenderId(db, senderId)]).then(function (values) {
      var people = values[0];
      var records = values[1];
      candidateList = getUnknownPeople(records, people);
      if (candidateList.length > 0) {
        randomPerson = listManager.getRandomItem(candidateList);

        // insert a new record
        return recordsResource.insertOne(db, {
          key: randomPerson.key,
          firstname: randomPerson.firstname,
          score: 0,
          senderId: senderId,
          time: time
        });
      } else {
        candidateList = getLeastKnownPeople(records, people);
        randomPerson = listManager.getRandomItem(candidateList);

        // update records with new question time
        return recordsResource.updateOne(db, senderId, randomPerson.key, time);
      }
    }).then(function () {
      return resolve(randomPerson);
    }).catch(function (err) {
      reject(err);
    });
  });
};

var processAnswer = function processAnswer(lastRecord, answer) {
  var expectedAnswer = lastRecord.firstname;
  var personKey = lastRecord.key;
  return textProcessor.isRightAnswer(answer, expectedAnswer);
};

var updateScore = function updateScore(db, senderId, personKey, answerType) {
  var scoreDiff = void 0;
  switch (answerType) {
    case 'right':
      scoreDiff = 1;
      break;
    case 'wrong':
      scoreDiff = -0.2;
      break;
    case 'hint':
      scoreDiff = -0.1;
      break;
    case 'drop':
      scoreDiff = -0.5;
      break;
    default:
      scoreDiff = 0;
  }
  return new Promise(function (resolve, reject) {
    recordsResource.increaseScoreBy(db, senderId, personKey, scoreDiff).then(function () {
      return resolve();
    }).catch(function (err) {
      return reject(err);
    });
  });
};

var sumScores = function sumScores(records) {
  return records.map(function (record) {
    return record.score;
  }).reduce(function (score1, score2) {
    return score1 + score2;
  }, 0);
};

var computeScore = function computeScore(db, senderId) {
  return new Promise(function (resolve, reject) {
    Promise.all([peopleResource.findAll(db), recordsResource.findBySenderId(db, senderId, true)]).then(function (values) {
      var people = values[0];
      var records = values[1];
      var score = 0;
      var negativeRecords = records.filter(function (record) {
        return record.score <= 0;
      });
      var negativeQuota = negativeRecords.length;
      var negativeScore = sumScores(negativeRecords);
      var positiveRecords = records.filter(function (record) {
        return record.score > 0;
      });
      var positiveQuota = positiveRecords.length;
      var positiveScore = sumScores(positiveRecords);

      score = ((negativeScore + positiveScore) * 100 / (positiveScore + negativeQuota)).toFixed(2);
      var scoreEmoji = '0x1F631';
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

      var coverage = ((people.length - getUnknownPeople(records, people).length) * 100 / people.length).toFixed(2);
      var coverageEmoji = '0x1F631';
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

      return resolve({
        coverage: {
          emoji: coverageEmoji,
          value: coverage
        },
        score: {
          emoji: scoreEmoji,
          value: score
        }
      });
    }).catch(function (err) {
      return reject(err);
    });
  });
};

module.exports = {
  computeScore: computeScore,
  generateQuestion: generateQuestion,
  processAnswer: processAnswer,
  updateScore: updateScore
};
