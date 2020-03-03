const path = require('path')
const fs = require('fs')
const config = require('../config')
const sendLog = require('./sendLog')
const storage = require('./storage')

const BaseDestiny = path.join(__dirname, '..', 'downloads')

fs.mkdir(BaseDestiny, (err) => {
  if (err && err.code !== 'EEXIST') throw new Error('up')
})

const classFiles = async (classStudent, telegram) => {
  try {
    const data = storage.getData('files')
    var files = await classStudent.getFiles() // this lists all files
    if (!data[classStudent.id]) data[classStudent.id] = []

    for (const file of files) { // for each topic
      if (!data[classStudent.id].includes(file.id)) {
        try {
          const filepath = await file.download(BaseDestiny)
          const fileExtension = path.extname(filepath)
          const photoExtension = ['.jpg', '.png', '.gif']
          if (photoExtension.indexOf(fileExtension) > -1) {
            let telegramPhoto
            for (const chatID of config.notifications.chatIDs) {
              if (telegramPhoto) {
                await telegram.sendPhoto(chatID, telegramPhoto.photo[0]['file_id'])
              } else {
                telegramPhoto = await telegram.sendPhoto(chatID, {
                  source: filepath
                })
              }
            }
          } else {
            let telegramFile
            for (const chatID of config.notifications.chatIDs) {
              if (telegramFile) {
                await telegram.sendDocument(chatID, telegramFile.document['file_id'])
              } else {
                telegramFile = await telegram.sendDocument(chatID, {
                  source: filepath
                })
              }
            }
          }
          data[classStudent.id].push(file.id)
          storage.saveData('files', data)
          fs.unlink(filepath, (err) => {
            if (err) {
              sendLog.error(err)
            }
          })
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
