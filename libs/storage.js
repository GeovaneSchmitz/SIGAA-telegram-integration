const path = require('path')
const fs = require('fs')
const sendLog = require('./sendLog')
const storageDataFilename = path.join(__dirname, '..', '.data/', 'data.json')
let data
const storage = {}

const writeData = () => {
  fs.writeFile(storageDataFilename, JSON.stringify(data), function (err) {
    if (err) {
      sendLog.error(err)
    }
  })
}

try {
  data = require(storageDataFilename)
} catch (err) {
  data = {
  }
  writeData()
}

storage.saveData = (field, value) => {
  data[field] = value
  writeData()
}
storage.getData = (field) => {
  if (data[field] === undefined) {
    return {}
  } else {
    return data[field]
  }
}
module.exports = storage
