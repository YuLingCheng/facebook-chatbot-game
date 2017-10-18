const getRandomIndex = list => {
  return Math.floor(Math.random() * list.length)
}

const getRandomItem = list => {
  return list[getRandomIndex(list)]
}

module.exports = {
  getRandomItem
}
