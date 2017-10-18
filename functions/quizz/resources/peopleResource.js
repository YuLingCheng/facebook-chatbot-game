const mongojs = require('mongojs')
const db = mongojs(process.env.MONGO_URI)

const findAll = () => {
  return new Promise((resolve, reject) => {
    db.collection('people').find({}, (err, people) => {
      if (err) {return reject(err)}
      try {
        db.close()
      } catch (exception) {}
      return resolve(people)
    })
  })
}

module.exports = {
  findAll
}
