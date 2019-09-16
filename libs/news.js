const textUtils = require('./textUtils')
const Sigaa = require('sigaa-api')
const Telegram = require('telegraf/telegram')

async function classNews (storage) {
  const telegram = new Telegram(process.env.BOT_TOKEN)
  const sigaa = new Sigaa({
    url: process.env.SIGAA_URL
  })

  const account = await sigaa.login(process.env.SIGAA_USERNAME, process.env.SIGAA_PASSWORD) // login
  const classes = await account.getClasses() // this return a array with all classes

  const data = storage.getData('news')
  for (const classStudent of classes) { // for each class
    console.log(textUtils.getPrettyClassName(classStudent.title))
    var newsList = await classStudent.getNews() // this lists all news
    if (!data[classStudent.id]) data[classStudent.id] = []

    const newNews = newsList.filter(news => {
      return data[classStudent.id].indexOf(news.id) === -1
    })

    for (const news of newNews) { // for each news
      try {
        const msg = `${textUtils.getPrettyClassName(classStudent.title)}\n` +
          `${news.title}\n` +
          `${await news.getContent()}\n` +
          `Enviado em ${textUtils.createDateString(await news.getDate())}`
        await telegram.sendMessage(process.env.CHAT_ID, msg)
        data[classStudent.id].push(news.id)
        storage.saveData('news', data)
      } catch (err) {
        console.log(err)
      }
    }
  }
  account.logoff()
}

module.exports = classNews
