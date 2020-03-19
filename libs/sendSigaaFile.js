const path = require('path')
const fs = require('fs')
const config = require('../config')
const BaseDestiny = path.join(__dirname, '..', 'downloads')
const sendLog = require('./sendLog')

fs.mkdir(BaseDestiny, (err) => {
  if (err && err.code !== 'EEXIST') throw new Error('up')
})

const sendSigaaFile = async (file, classStudent, telegram) => {
  const filepath = await file.download(BaseDestiny)
  const abbreviation = classStudent.abbreviation.replace(/[0-9]*/g, '')
  const filename = `${abbreviation} - ${path.basename(filepath)}`
  let telegramFile
  for (const chatID of config.notifications.chatIDs) {
    if (telegramFile) {
      await telegram.sendDocument(chatID, telegramFile.document['file_id'])
    } else {
      telegramFile = await telegram.sendDocument(chatID, {
        source: filepath,
        filename
      })
      fs.unlink(filepath, (err) => {
        if (err) {
          sendLog.error(err)
        }
      })
    }
  }
}

module.exports = sendSigaaFile
