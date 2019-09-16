const path = require('path')
const fs = require('fs')
const storageDataFilename = path.join(__dirname, '..', '.data/', 'data.json')
let data
const storage = {}

const writeData = () => {
  fs.writeFile(storageDataFilename, JSON.stringify(data), function (err) {
    if (err) console.log(err)
  })
}

try {
  data = require(storageDataFilename)
} catch (err) {
  data = {
    topics: {},
    grades: {},
    news: {}
  }
  writeData()
}

storage.saveData = (field, value) => {
  data[field] = value
  writeData()
}
storage.getData = (field) => {
  return data[field]
}
module.exports = storage
