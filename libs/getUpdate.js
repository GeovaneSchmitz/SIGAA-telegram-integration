
const Telegram = require('telegraf/telegram')
const Sigaa = require('sigaa-api')

const grades = require('./grades')
const news = require('./news')
const topics = require('./topics')
const members = require('./members')
const educationalPlan = require('./educationalPlan')

const config = require('../config')
const textUtils = require('./textUtils')
const sendLog = require('./sendLog')
const calcTime = (endTime, startTime, label) => {
  const deltaTime = Math.trunc((endTime - startTime) / 1000)
  let deltaText
  if (deltaTime >= 60) {
    deltaText = Math.trunc(deltaTime / 60) + 'min'
  } else {
    deltaText = deltaTime + 's'
  }
  return `> ${label}: ${deltaText}`
}
const getUpdateMsg = async ({ sendToTelegram, chatId } = {}) => {
  try {
    const telegram = new Telegram(process.env.BOT_TOKEN)
    const sigaa = new Sigaa({
      url: config.sigaa.url
    })
    const account = await sigaa.login(process.env.SIGAA_USERNAME, process.env.SIGAA_PASSWORD) // login
    const classes = await account.getClasses() // this return a array with all classes
    for (const classStudent of classes) { // for each class
      const classStartTime = Date.now()
      const tasks = [
        { name: 'TopicsAndFiles', label: 'Topics and Files', function: () => topics(classStudent, telegram) },
        { name: 'news', label: 'News', function: () => news(classStudent, telegram) },
        { name: 'educationalPlan', label: 'Education Plan', function: () => educationalPlan.educationalPlanNotify(classStudent, telegram) },
        { name: 'grades', label: 'Grades', function: () => grades(classStudent, telegram) }
      ]
      const promises = tasks.map(task => {
        if (config.notifications[task.name]) {
          return task.function.call()
            .then(() => {
              return {
                status: 'OK',
                label: task.label,
                endTime: Date.now()
              }
            })
            .catch((error) => {
              sendLog.error(error)
              return {
                status: 'Error',
                label: task.label
              }
            })
        } else {
          return Promise.resolve({
            status: 'Disabled',
            label: task.label
          })
        }
      })
      const classeTitle = textUtils.getPrettyClassName(classStudent.title)
      const msg = [classeTitle]
      msg.push(
        await Promise.all(promises)
          .then((promiseResponses) => {
            return promiseResponses.map(response => {
              if (response.status === 'ok') {
                return calcTime(response.endTime, classStartTime, response.label)
              } else {
                return `> ${response.label}: ${response.status}`
              }
            })
          })
      )
      sendLog.log(msg.join('\n'), { sendToTelegram, chatId })
    }
  } catch (err) {
    sendLog.error(err)
  }
  // eslint-disable-next-line require-atomic-updates
}

getUpdateMsg({ sendToTelegram: false })
setInterval(() => {
  getUpdateMsg({ sendToTelegram: false })
}, config.notifications.updateInterval)

members()
setInterval(() => {
  members()
}, config.search.intervalToFetchClassMembers)

module.exports = getUpdateMsg
