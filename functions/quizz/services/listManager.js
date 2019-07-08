"use strict";

var getRandomIndex = function getRandomIndex(list) {
  return Math.floor(Math.random() * list.length);
};

var getRandomItem = function getRandomItem(list) {
  return list[getRandomIndex(list)];
};

module.exports = {
  getRandomItem: getRandomItem
};
