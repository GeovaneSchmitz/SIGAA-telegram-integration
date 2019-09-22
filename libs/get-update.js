
const Telegram = require('telegraf/telegram')
const Sigaa = require('sigaa-api')

const grades = require('./grades')
const news = require('./news')
const topics = require('./topics')

const storage = require('./storage')
const textUtils = require('./textUtils')

const getUpdate = async () => {
  const telegram = new Telegram(process.env.BOT_TOKEN)
  const sigaa = new Sigaa({
    url: process.env.SIGAA_URL
  })
  try {
    const account = await sigaa.login(process.env.SIGAA_USERNAME, process.env.SIGAA_PASSWORD) // login
    const classes = await account.getClasses() // this return a array with all classes
    for (const classStudent of classes) { // for each class
      console.log(textUtils.getPrettyClassName(classStudent.title))
      try {
        console.log('> topics')
        await topics(classStudent, storage, telegram)
      } catch (err) {
        console.log(err)
      }
      try {
        console.log('> news')
        await news(classStudent, storage, telegram)
      } catch (err) {
        console.log(err)
      }
      try {
        console.log('> grades')
        await grades(classStudent, storage, telegram)
      } catch (err) {
        console.log(err)
      }
    }
  } catch (err) {
    console.log(err)
  }
}

module.exports = getUpdate
