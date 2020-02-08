const path = require('path')
const fs = require('fs')
const sendLog = require('./sendLog')
const storageDataFilename = path.join(__dirname, '..', '.data/', 'data.json')
let data
const storage = {}

const writeData = () => {
  return new Promise((resolve, reject) => {
    fs.writeFile(storageDataFilename, JSON.stringify(data), function (err) {
      if (err) {
        sendLog.error(err)
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

try {
  data = require(storageDataFilename)
} catch (err) {
  data = {
  }
  writeData()
}

storage.updateData = (newData) => {
  data = newData
  return writeData()
}

storage.saveData = (field, value) => {
  data[field] = value
  return writeData()
}
storage.getData = (field) => {
  if (data[field] === undefined) {
    return {}
  } else {
    return data[field]
  }
}
module.exports = storage
