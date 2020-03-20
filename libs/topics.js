const fs = require('fs')
const textUtils = require('./textUtils')
const config = require('../config')
const path = require('path')
const sendLog = require('./sendLog')
const storage = require('./storage')
const { SigaaErrors } = require('sigaa-api')
const { genFileNameWithClassAbbreviation } = require('./files')

const BaseDestiny = path.join(__dirname, '..', 'downloads')

fs.mkdir(BaseDestiny, (err) => {
  if (err && err.code !== 'EEXIST') throw new Error('up')
})

const classTopics = async (classStudent, telegram) => {
  const data = storage.getData('topics')
  const topics = await classStudent.getTopics() // this lists all topics
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
        startDate: new Date(topic.startDate),
        endDate: new Date(topic.endDate)
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
        const foundAttachment = data[classStudent.id][topicIndex].attachments.find((storedAttachment) => {
          return attachment.type === storedAttachment.type &&
            ((attachment.id && attachment.id === storedAttachment.id) || (attachment.src && attachment.src === storedAttachment.src))
        })
        if (!foundAttachment) {
          try {
            let msg = ''
            let file = null
            const classTitle = textUtils.getPrettyClassName(classStudent.title)
            if (attachment.type === 'quiz') {
              const quizTitle = attachment.title
              const quizStartDate = await attachment.startDate
              const quizEndDate = await attachment.endDate
              const msgArray = [`Pesquisa de ${classTitle}`]
              msgArray.push(quizTitle)
              msgArray.push(textUtils.createDeadLineString(quizStartDate, quizEndDate))
              msg = msgArray.join('\n')
            } else if (attachment.type === 'homework') {
              const homeworkTitle = attachment.title
              const homeworkDescription = await attachment.getDescription()
              const homeworkHaveGrade = await attachment.getHaveGrade()
              const homeworkStartDate = await attachment.startDate
              const homeworkEndDate = await attachment.endDate
              const msgArray = [`Tarefa de ${classTitle}`]
              msgArray.push(homeworkTitle)
              msgArray.push(homeworkDescription)
              msgArray.push('')
              if (homeworkHaveGrade) {
                msgArray.push('Tem nota')
              }
              msgArray.push(textUtils.createDeadLineString(homeworkStartDate, homeworkEndDate))
              msg = msgArray.join('\n')
              try {
                file = await attachment.getAttachmentFile()
              } catch (err) {
                if (err.message !== SigaaErrors.SIGAA_HOMEWORK_HAS_BEEN_SUBMITTED && err.message !== SigaaErrors.SIGAA_HOMEWORK_HAS_NO_FILE) {
                  throw err
                }
              }
            } else if (attachment.type === 'webcontent') {
              const webContentTitle = attachment.title
              const webContentBody = await attachment.getContent()
              const webcontentDate = await attachment.getDate()
              const msgArray = [classTitle]
              msgArray.push(webContentTitle)
              if (attachment.description) {
                msgArray.push(attachment.description)
              }
              msgArray.push(webContentBody)
              msgArray.push(textUtils.createDateString(webcontentDate))
              msg = msgArray.join('\n')
            } else if (attachment.type === 'video') {
              const videoTitle = attachment.title
              const videoDescription = attachment.description
              const msgArray = [attachment.src]
              msgArray.push(classTitle)
              msgArray.push(videoTitle)
              msgArray.push(videoDescription)
              msg = msgArray.join('\n')
            }

            if (msg !== '') {
              let filepath = null
              let filename = null
              let telegramFile = null

              if (file) {
                filepath = await file.download(BaseDestiny)
                filename = genFileNameWithClassAbbreviation(classStudent, filepath)
              }

              for (const chatID of config.notifications.chatIDs) {
                const msgResult = await telegram.sendMessage(chatID, msg)
                if (file) {
                  if (telegramFile) {
                    await telegram.sendDocument(chatID, telegramFile.document['file_id'], {
                      reply_to_message_id: msgResult['message_id']
                    })
                  } else {
                    telegramFile = await telegram.sendDocument(chatID, {
                      source: filepath,
                      filename
                    }, {
                      reply_to_message_id: msgResult['message_id']
                    })
                    fs.unlink(filepath, (err) => {
                      if (err) {
                        sendLog.error(err)
                      }
                    })
                  }
                }
              }

              data[classStudent.id][topicIndex].attachments.push({
                type: attachment.type,
                id: attachment.id
              })
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
