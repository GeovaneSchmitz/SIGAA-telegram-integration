const textUtils = require('./textUtils')
const config = require('../config')
const sendLog = require('./sendLog')
const storage = require('./storage')
const { SigaaErrors } = require('sigaa-api')
const sendSigaaFile = require('./sendSigaaFile')

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
            const classTitle = textUtils.getPrettyClassName(classStudent.title)
            if (attachment.type === 'quiz') {
              const quizTitle = attachment.title
              const quizStartDate = await attachment.startDate
              const quizEndDate = await attachment.endDate
              const msgArray = [`Pesquisa de ${classTitle}`]
              msgArray.push(quizTitle)
              msgArray.push(`Período de envio inicia em ${textUtils.createDateString(quizStartDate)} e termina em ${textUtils.createDateString(quizEndDate)}`)
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
              msgArray.push(`Período de envio inicia em ${textUtils.createDateString(homeworkStartDate)} e termina em ${textUtils.createDateString(homeworkEndDate)}`)
              msg = msgArray.join('\n')
              try {
                const file = await attachment.getAttachmentFile()
                await sendSigaaFile(file, classStudent, telegram)
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
              for (const chatID of config.notifications.chatIDs) {
                await telegram.sendMessage(chatID, msg)
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
