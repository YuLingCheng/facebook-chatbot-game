'use strict';

var mongojs = require('mongojs');
var db = mongojs(process.env.MONGO_URI);

var findAll = function findAll() {
  return new Promise(function (resolve, reject) {
    db.collection('people').find({}, function (err, people) {
      if (err) {
        return reject(err);
      }
      try {
        // db.close();
      } catch (exception) {}
      return resolve(people);
    });
  });
};

module.exports = {
  findAll: findAll
};
