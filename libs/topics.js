const path = require('path')
const textUtils = require('./textUtils')
const fs = require('fs')
const config = require('../config')
const sendLog = require('./sendLog')

const BaseDestiny = path.join(__dirname, '..', 'downloads')

const classTopics = async (classStudent, storage, telegram) => {
  const data = storage.getData('topics')
  var topics = await classStudent.getTopics() // this lists all topics
  if (!data[classStudent.id]) data[classStudent.id] = []
  const dataTopicsWithoutAttachmentString = data[classStudent.id].map((topic) => {
    const topicClone = JSON.parse(JSON.stringify(topic))
    delete topicClone.attachments
    return JSON.stringify(topicClone)
  })
  for (const topic of topics) { // for each topic
    try {
      const topicObj = {
        title: topic.title,
        contentText: topic.contentText,
        startTimestamp: Math.trunc(topic.startDate.valueOf() / 1000),
        endTimestamp: Math.trunc(topic.endDate.valueOf() / 1000)
      }
      let topicIndex = dataTopicsWithoutAttachmentString.indexOf(JSON.stringify(topicObj))
      topicObj.attachments = []
      if (topicIndex === -1) {
        const date = textUtils.createDatesString(topic.startDate, topic.endDate)
        let msg = `${textUtils.getPrettyClassName(classStudent.title)}\n`
        msg += `${topic.title}\n`
        if (topic.contentText !== '') msg += `${topic.contentText}\n`
        msg += date
        for (const chatID of config.notifications.chatIDs) {
          await telegram.sendMessage(chatID, msg)
        }
        topicObj.attachments = []
        topicIndex = data[classStudent.id].length
        data[classStudent.id].push(topicObj)
        storage.saveData('topics', data)
      }
      topicObj.attachments = []

      for (const attachment of topic.attachments) {
        if (attachment.id && data[classStudent.id][topicIndex].attachments.indexOf(attachment.id) === -1) {
          try {
            if (attachment.type === 'file') {
              const filepath = await attachment.download(BaseDestiny)
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
              data[classStudent.id][topicIndex].attachments.push(attachment.id)
              storage.saveData('topics', data)
              fs.unlink(filepath, (err) => {
                if (err) {
                  sendLog.error(err)
                }
              })
            }
            if (attachment.type === 'quiz') {
              const msg = `Pesquisa\n${attachment.title}\nPeríodo de envio inicia em ${textUtils.createDateString(attachment.startDate)} e termina em ${textUtils.createDateString(attachment.endDate)}`
              for (const chatID of config.notifications.chatIDs) {
                await telegram.sendMessage(chatID, msg)
              }
              data[classStudent.id][topicIndex].attachments.push(attachment.id)
              storage.saveData('topics', data)
            }
            if (attachment.type === 'homework') {
              let msg = `Tarefa\n`
              msg += `${attachment.title}\n`
              msg += `${await attachment.getDescription()}\n\n`
              if (await attachment.getHaveGrade()) {
                msg += `Tem nota\n`
              }
              msg += `Período de envio inicia em ${textUtils.createDateString(attachment.startDate)} e termina em ${textUtils.createDateString(attachment.startDate)}`
              for (const chatID of config.notifications.chatIDs) {
                await telegram.sendMessage(chatID, msg)
              }
              data[classStudent.id][topicIndex].attachments.push(attachment.id)
              storage.saveData('topics', data)
            }
            if (attachment.type === 'webcontent') {
              const msgArray = [attachment.title]
              if (attachment.description) {
                msgArray.push(attachment.description)
              }
              const content = await attachment.getContent()
              const date = await attachment.getDate()
              const dateString = textUtils.createDateString(date)

              msgArray.push(content)
              msgArray.push(dateString)

              const msg = msgArray.join('\n')
              for (const chatID of config.notifications.chatIDs) {
                await telegram.sendMessage(chatID, msg)
              }
              data[classStudent.id][topicIndex].attachments.push(attachment.id)
              storage.saveData('topics', data)
            }
          } catch (err) {
            sendLog.error(err)
          }
        } else if (attachment.src && data[classStudent.id][topicIndex].attachments.indexOf(attachment.src) === -1) {
          try {
            if (attachment.type === 'video') {
              let msg = `${attachment.src}\n`
              msg += `${textUtils.getPrettyClassName(classStudent.title)}\n`
              msg += `${attachment.title}\n`
              msg += `${attachment.description}`
              for (const chatID of config.notifications.chatIDs) {
                await telegram.sendMessage(chatID, msg)
              }
              data[classStudent.id][topicIndex].attachments.push(attachment.src)
              storage.saveData('topics', data)
            }
          } catch (err) {
            sendLog.error(err)
          }
        }
      }
    } catch (err) {
      sendLog.error(err)
    }
  }
}

module.exports = classTopics
