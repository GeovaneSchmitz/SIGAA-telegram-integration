const path = require('path')
const fs = require('fs')
const sendLog = require('./sendLog')
const storageDataFilename = path.join(__dirname, '..', '.data/', 'data.json')
let data
const storage = {}
let lockWrite = null
const writeData = (lockWriteId) => {
  return new Promise((resolve, reject) => {
    if (!lockWrite || lockWriteId === lockWrite) {
      fs.writeFile(storageDataFilename, JSON.stringify(data), function (err) {
        if (err) {
          sendLog.error(err)
          reject(err)
        } else {
          resolve()
        }
      })
    } else {
      console.log('lock write')
    }
    resolve()
  })
}

try {
  data = require(storageDataFilename)
} catch (err) {
  data = {
  }
  writeData()
}

storage.updateData = (newData, lockWriteId) => {
  if (!lockWrite || lockWrite === lockWriteId) {
    data = newData
    return writeData(lockWriteId)
  }
}
storage.lockWrite = (id) => {
  if (!lockWrite) {
    lockWrite = id
  }
}
storage.unlockWrite = (id) => {
  if (lockWrite === id) {
    lockWrite = null
  }
}
storage.saveData = (field, value, lockWriteId) => {
  if (!lockWrite || lockWrite === lockWriteId) {
    data[field] = value
    return writeData(lockWrite)
  }
}
storage.getData = (field) => {
  if (data[field] === undefined) {
    return {}
  } else {
    return data[field]
  }
}
module.exports = storage
