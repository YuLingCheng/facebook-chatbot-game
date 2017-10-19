'use strict';

var mongojs = require('mongojs');
var db = mongojs(process.env.MONGO_URI);

var findBySenderId = function findBySenderId(senderId, closeConnection) {
  return new Promise(function (resolve, reject) {
    db.collection('records').find({ senderId: senderId }).sort({ score: 1 }).toArray(function (err, records) {
      if (err) {
        return reject(err);
      }
      if (closeConnection) {
        // db.close();
      }
      return resolve(records);
    });
  });
};

var findLastBySenderId = function findLastBySenderId(senderId) {
  return new Promise(function (resolve, reject) {
    db.collection('records').find({ senderId: senderId }).sort({ time: -1 }).limit(1).toArray(function (err, lastRecord) {
      if (err) {
        return reject(err);
      }
      return resolve(lastRecord[0] || null);
    });
  });
};

var insertOne = function insertOne(record) {
  return new Promise(function (resolve, reject) {
    db.collection('records').insert(record, function (err) {
      if (err) {
        return reject(err);
      }
      // db.close();
      return resolve();
    });
  });
};

var updateOne = function updateOne(senderId, personKey, time) {
  return new Promise(function (resolve, reject) {
    db.collection('records').update({ senderId: senderId, key: personKey }, { $set: { time: time } }, function (err) {
      if (err) {
        return reject(err);
      }
      // db.close();
      return resolve();
    });
  });
};

var increaseScoreBy = function increaseScoreBy(senderId, personKey, value, closeConnection) {
  return new Promise(function (resolve, reject) {
    db.collection('records').update({ senderId: senderId, key: personKey }, { $inc: { score: value } }, function (err) {
      if (err) {
        return reject(err);
      }
      if (closeConnection) {
        // db.close();
      }
      return resolve();
    });
  });
};

module.exports = {
  findBySenderId: findBySenderId,
  findLastBySenderId: findLastBySenderId,
  increaseScoreBy: increaseScoreBy,
  insertOne: insertOne,
  updateOne: updateOne
};
