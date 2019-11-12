
const Telegram = require('telegraf/telegram')
const Sigaa = require('sigaa-api')

const grades = require('./grades')
const news = require('./news')
const topics = require('./topics')
const members = require('./members')

const config = require('../config')
const storage = require('./storage')
const textUtils = require('./textUtils')
const sendLog = require('./sendLog')

let isUpdating = false

const getUpdateMsg = async () => {
  if (!isUpdating) {
    isUpdating = true
    try {
      const telegram = new Telegram(process.env.BOT_TOKEN)
      const sigaa = new Sigaa({
        url: config.sigaa.url
      })
      const account = await sigaa.login(process.env.SIGAA_USERNAME, process.env.SIGAA_PASSWORD) // login
      const classes = await account.getClasses() // this return a array with all classes
      for (const classStudent of classes) { // for each class
        console.log(textUtils.getPrettyClassName(classStudent.title))
        try {
          console.log('> topics')
          await topics(classStudent, storage, telegram)
        } catch (err) {
          console.error(err)
          sendLog.sendError(err)
        }
        try {
          console.log('> news')
          await news(classStudent, storage, telegram)
        } catch (err) {
          console.error(err)
          sendLog.sendError(err)
        }
        try {
          console.log('> grades')
          await grades(classStudent, storage, telegram)
        } catch (err) {
          console.error(err)
          sendLog.sendError(err)
        }
      }
    } catch (err) {
      console.error(err)
      sendLog.sendError(err)
    }
    // eslint-disable-next-line require-atomic-updates
    isUpdating = false
    return true
  } else {
    return false
  }
}

getUpdateMsg()
setInterval(() => {
  getUpdateMsg()
}, config.notifications.updateInterval)

members(storage)
setInterval(() => {
  members(storage)
}, config.search.intervalToFetchClassMembers)

module.exports = getUpdateMsg
