const mongojs = require('mongojs')
const db = mongojs(process.env.MONGO_URI)

const findBySenderId = (senderId, closeConnection) => {
  return new Promise((resolve, reject) => {
    db.collection('records')
    .find({senderId: senderId})
    .sort({score: 1})
    .toArray((err, records) => {
      if (err) {return reject(err)}
      if (closeConnection) { db.close() }
      return resolve(records)
    })
  })
}

const findLastBySenderId = senderId => {
  return new Promise((resolve, reject) => {
    db.collection('records')
    .find({senderId: senderId})
    .sort({time: -1})
    .limit(1)
    .toArray((err, lastRecord) => {
      if (err) {return reject(err)}
      return resolve(lastRecord[0] || null)
    })
  })
}

const insertOne = record => {
  return new Promise((resolve, reject) => {
    db.collection('records').insert(record, (err) => {
      if (err) {return reject(err)}
      db.close()
      return resolve()
    })
  })
}

const updateOne = (senderId, personKey, time) => {
  return new Promise((resolve, reject) => {
    db.collection('records').update(
      { senderId, key: personKey },
      { $set: { time } },
      err => {
        if (err) {return reject(err)}
        db.close()
        return resolve()
      }
    )
  })
}

const increaseScoreBy = (senderId, personKey, value, closeConnection) => {
  return new Promise((resolve, reject) => {
    db.collection('records').update(
      { senderId, key: personKey },
      { $inc: { score: value } },
      err => {
        if (err) {return reject(err)}
        if (closeConnection) { db.close() }
        return resolve()
      }
    )
  })
}

module.exports = {
  findBySenderId,
  findLastBySenderId,
  increaseScoreBy,
  insertOne,
  updateOne
}
