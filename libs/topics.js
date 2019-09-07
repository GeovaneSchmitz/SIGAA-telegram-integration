const path = require('path')
const textUtils = require('./textUtils')
const Sigaa = require('sigaa-api')
const Telegram = require('telegraf/telegram')
const fs = require('fs')

const BaseDestiny = path.join(__dirname, '..', 'downloads')

async function classTopics (storage) {
  const telegram = new Telegram(storage.credentials.token)
  const sigaa = new Sigaa({
    url: 'https://sigaa.ifsc.edu.br'
  })

  const account = await sigaa.login(storage.credentials.username, storage.credentials.password) // login
  const classes = await account.getClasses() // this return a array with all classes
  const data = storage.getData('topics')
  for (const classStudent of classes) { // for each class
    try {
      console.log(textUtils.getPrettyClassName(classStudent.title))
      var topics = await classStudent.getTopics() // this lists all topics
      if (!data[classStudent.id]) data[classStudent.id] = []

      const dataTopicsWithoutAttachmentString = data[classStudent.id].map((topic) => {
        const topicClone = JSON.parse(JSON.stringify(topic))
        delete topicClone.attachments
        return JSON.stringify(topicClone)
      })
      let firstTopic = true
      for (const topic of topics) { // for each topic
        const topicObj = {
          title: topic.title,
          contentText: topic.contentText,
          startTimestamp: topic.startTimestamp,
          endTimestamp: topic.endTimestamp
        }
        let topicIndex = dataTopicsWithoutAttachmentString.indexOf(JSON.stringify(topicObj))
        topicObj.attachments = []
        if (topicIndex === -1) {
          const date = textUtils.createDatesFromTimestamps(topic.startTimestamp, topic.endTimestamp)
          let msg = ''
          if (firstTopic) {
            msg += `${textUtils.getPrettyClassName(classStudent.title)}\n`
            firstTopic = false
          }
          msg += `${topic.title}\n`
          if (topic.contentText !== '') msg += `${topic.contentText}\n`
          msg += `${date}`
          await telegram.sendMessage(storage.credentials.chatId, msg)
          topicObj.attachments = []
          data[classStudent.id].push(topicObj)
          topicIndex = data[classStudent.id].length - 1
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
                if (firstTopic) {
                  await telegram.sendMessage(storage.credentials.chatId, textUtils.getPrettyClassName(classStudent.title))
                  firstTopic = false
                }
                if (photoExtension.indexOf(fileExtension) > -1) {
                  await telegram.sendPhoto(storage.credentials.chatId, {
                    source: filepath
                  })
                } else {
                  await telegram.sendDocument(storage.credentials.chatId, {
                    source: filepath
                  })
                }
                data[classStudent.id][topicIndex].attachments.push(attachment.id)
                storage.saveData('topics', data)
                await new Promise((resolve) => {
                  fs.unlink(filepath, (err) => {
                    if (err) {
                      console.error(err)
                    }
                    resolve()
                  })
                })
              }
              if (attachment.type === 'quiz') {
                const msg = `Pesquisa\n${attachment.title}\nPeríodo de envio inicia em ${textUtils.createFullDateFromTimestamp(attachment.startTimestamp)} e termina em ${textUtils.createFullDateFromTimestamp(attachment.endTimestamp)}`
                await telegram.sendMessage(storage.credentials.chatId, `${textUtils.getPrettyClassName(classStudent.title)}\n${msg}`)
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
                msg += `Período de envio inicia em ${textUtils.createFullDateFromTimestamp(attachment.startTimestamp)} e termina em ${textUtils.createFullDateFromTimestamp(attachment.endTimestamp)}`
                await telegram.sendMessage(storage.credentials.chatId, `${textUtils.getPrettyClassName(classStudent.title)}\n${msg}`)
                data[classStudent.id][topicIndex].attachments.push(attachment.id)
                storage.saveData('topics', data)
              }
              if (attachment.type === 'webcontent') {
                let msg = `${attachment.title}\n`
                msg += `${await attachment.getDescription()}\n`
                await telegram.sendMessage(storage.credentials.chatId, `${textUtils.getPrettyClassName(classStudent.title)}\n${msg}`)
                data[classStudent.id][topicIndex].attachments.push(attachment.id)
                storage.saveData('topics', data)
              }
            } catch (err) {
              console.log(err)
            }
          } else if (attachment.src && data[classStudent.id][topicIndex].attachments.indexOf(attachment.src) === -1) {
            try {
              if (attachment.type === 'video') {
                await telegram.sendMessage(storage.credentials.chatId, attachment.src)
                let msg = `${textUtils.getPrettyClassName(classStudent.title)}\n`
                msg += `${attachment.title}\n`
                msg += `${attachment.description}`
                await telegram.sendMessage(storage.credentials.chatId, msg)
                data[classStudent.id][topicIndex].attachments.push(attachment.src)
                storage.saveData('topics', data)
              }
            } catch (err) {
              console.log(err)
            }
          }
        }
      }
    } catch (err) {
      console.log(err)
    }
  }
  account.logoff()
}

module.exports = classTopics
