const path = require('path')
const fs = require('fs')
const storageDataFilename = path.join(__dirname, '..', 'data.json')
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
let credentials
try {
  credentials = require('../credentials.json')
  if (credentials.username === '' ||
  credentials.password === '' ||
  credentials.token === '' ||
  credentials.chatId === '') {
    throw new Error('invalid credentials')
  }
} catch (err) {
  console.log('fill in the credentials.json')
  credentials = {
    username: '',
    password: '',
    token: '',
    chatId: ''
  }
  fs.writeFile('../credentials.json', JSON.stringify(credentials), function (err) {
    if (err) throw err
  })
}
storage.saveData = (field, value) => {
  data[field] = value
  writeData()
}
storage.getData = (field) => {
  return data[field]
}
storage.credentials = credentials
module.exports = storage
