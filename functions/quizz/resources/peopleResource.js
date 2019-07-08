"use strict";

var findAll = function findAll(db) {
  return new Promise(function(resolve, reject) {
    db.collection("people").find({}, function(err, people) {
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
