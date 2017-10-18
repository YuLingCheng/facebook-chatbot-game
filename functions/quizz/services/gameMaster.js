const secretary = require('./secretary.js');
const peopleResource = require('../resources/peopleResource.js');
const recordsResource = require('../resources/recordsResource.js');
const textProcessor = require('./textProcessor.js');
const listManager = require('./listManager.js')

const getUnknownPeople = (records, people) => {
  // find people that are not in the records yet
  const recordKeyList = records.map(record => (record.key))
  return people.filter(person => (recordKeyList.indexOf(person.key) < 0))
}

const getLeastKnownPeople = (records, people) => {
  const peopleKeyList = people.map(person => (person.key))
  const minScore = records[0].score;
  const minScoreKeyList = records
    .filter(record => (peopleKeyList.indexOf(record.key) >= 0 && record.score <= minScore + 1.5))
    .map(record => (record.key))
  return people.filter(person => (minScoreKeyList.indexOf(person.key) >= 0))
}

const generateQuestion = (senderId, time) => {
  // generate a question and saves it to database
  let randomPerson, candidateList

  return new Promise((resolve, reject) => {
    Promise.all([
      peopleResource.findAll(),
      recordsResource.findBySenderId(senderId)
    ]).then(values => {
      const people = values[0]
      const records = values[1]
      candidateList = getUnknownPeople(records, people)
      if (candidateList.length > 0) {
        randomPerson = listManager.getRandomItem(candidateList)

        // insert a new record
        return recordsResource.insertOne({
          key: randomPerson.key,
          firstname: randomPerson.firstname,
          score: 0,
          senderId: senderId,
          time: time
        })
      } else {
        candidateList = getLeastKnownPeople(records, people)
        randomPerson = listManager.getRandomItem(candidateList)

        // update records with new question time
        return recordsResource.updateOne(senderId, randomPerson.key, time)
      }
    }).then(() => {
      return resolve(randomPerson)
    }).catch(err => {
      reject(err)
    })
  })
}

const processAnswer = (lastRecord, answer) => {
  const expectedAnswer = lastRecord.firstname
  const personKey = lastRecord.key
  return textProcessor.isRightAnswer(answer, expectedAnswer)
}

const updateScore = (senderId, personKey, answerType) => {
  let scoreDiff, closeConnection
  switch (answerType) {
    case 'right':
      scoreDiff = 1
      break
    case 'wrong':
      scoreDiff = -0.2
      closeConnection = true
      break
    case 'hint':
      scoreDiff = -0.1
      closeConnection = true
      break
    case 'drop':
      scoreDiff = -0.5
      closeConnection = true
      break
    default:
      scoreDiff = 0
      closeConnection = false
  }
  return new Promise((resolve, reject) => {
    recordsResource.increaseScoreBy(senderId, personKey, scoreDiff, closeConnection).then(() =>{
      return resolve()
    }).catch(err => {return reject(err)})
  })
}

const sumScores = records => {
  return records
    .map(record => (record.score))
    .reduce((score1, score2) => (score1 + score2), 0)
}

const computeScore = senderId => {
  return new Promise((resolve, reject) => {
    Promise.all([
      peopleResource.findAll(),
      recordsResource.findBySenderId(senderId, true)
    ]).then(values => {
      const people = values[0]
      const records = values[1]
      const negativeRecords = records.filter(record => { return record.score <= 0 })
      const negativeQuota = negativeRecords.length
      const negativeScore = sumScores(negativeRecords)
      const positiveRecords = records.filter(record => { return record.score > 0 })
      const positiveQuota = positiveRecords.length
      const positiveScore = sumScores(positiveRecords)

      const score = ((negativeScore + positiveScore) * 100 / (positiveScore + negativeQuota)).toFixed(2)
      let scoreEmoji = '0x1F631'
      if (score >= 0 && score < 25) {
        scoreEmoji = '0x1F648'
      } else if (score >= 25 && score < 50) {
        scoreEmoji = '0x1F64A'
      } else if (score >= 50 && score < 75) {
        scoreEmoji = '0x1F64B'
      } else if (score >= 75 && score < 100) {
        scoreEmoji = '0x1F64C'
      } else if (score >= 100) {
        scoreEmoji = '0x1F680'
      }

      const coverage = ((people.length - getUnknownPeople(records, people).length) * 100 / people.length).toFixed(2)
      let coverageEmoji = '0x1F631'
      if (coverage >= 0 && coverage < 25) {
        coverageEmoji = '0x1F423'
      } else if (coverage >= 25 && coverage < 50) {
        coverageEmoji = '0x1F425'
      } else if (coverage >= 50 && coverage < 75) {
        coverageEmoji = '0x1F414'
      } else if (coverage >= 75 && coverage < 100) {
        coverageEmoji = '0x1F44C'
      } else if (coverage >= 100) {
        coverageEmoji = '0x1F44F'
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
      })
    }).catch(err => {return reject(err)})
  })
}

module.exports = {
  computeScore,
  generateQuestion,
  processAnswer,
  updateScore
}
