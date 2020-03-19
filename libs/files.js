const path = require('path')
const fs = require('fs')
const sendLog = require('./sendLog')
const sendSigaaFile = require('./sendSigaaFile')
const storage = require('./storage')
const BaseDestiny = path.join(__dirname, '..', 'downloads')

fs.mkdir(BaseDestiny, (err) => {
  if (err && err.code !== 'EEXIST') throw new Error('up')
})

const classFiles = async (classStudent, telegram) => {
  try {
    const data = storage.getData('files')
    const files = await classStudent.getFiles() // this lists all files
    if (!data[classStudent.id]) data[classStudent.id] = []

    for (const file of files) { // for each topic
      if (!data[classStudent.id].includes(file.id)) {
        try {
          await sendSigaaFile(file, classStudent, telegram)
          data[classStudent.id].push(file.id)
          storage.saveData('files', data)
        } catch (err) {
          sendLog.error(err)
        }
      }
    }
  } catch (err) {
    sendLog.error(err)
  }
}

module.exports = classFiles
