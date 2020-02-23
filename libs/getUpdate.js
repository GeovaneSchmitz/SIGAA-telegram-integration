
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
  if (endTime) {
    const deltaTime = Math.trunc((endTime - startTime) / 1000)
    let deltaText
    if (deltaTime >= 60) {
      deltaText = Math.trunc(deltaTime / 60) + 'min'
    } else {
      deltaText = deltaTime + 's'
    }
    return `> ${label}: ${deltaText}`
  } else {
    return `> ${label}: Error`
  }
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

      const topicsPromise = topics(classStudent, telegram)
        .then(() => Date.now())
        .catch((error) => sendLog.error(error))

      const newsPromise = news(classStudent, telegram)
        .then(() => Date.now())
        .catch((error) => sendLog.error(error))

      const educationalPlanPromise = educationalPlan.educationalPlanNotify(classStudent, telegram)
        .then(() => Date.now())
        .catch((error) => sendLog.error(error))

      const gradesPromise = grades(classStudent, telegram)
        .then(() => Date.now())
        .catch((error) => sendLog.error(error))

      await Promise.all([topicsPromise, newsPromise, educationalPlanPromise, gradesPromise])
        .then((times) => {
          const labels = ['Topics', 'News', 'Education Plan', 'Grades']
          const classeTitle = textUtils.getPrettyClassName(classStudent.title)
          const msg = [classeTitle]
          for (let i = 0; i < times.length; i++) {
            msg.push(calcTime(times[i], classStartTime, labels[i]))
          }
          sendLog.log(msg.join('\n'), { sendToTelegram, chatId })
        })
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
