const textUtils = require('./textUtils')
const Sigaa = require('sigaa-api')
const Telegram = require('telegraf/telegram')

async function classNews (storage) {
  const telegram = new Telegram(storage.credentials.token)
  const sigaa = new Sigaa({
    urlBase: 'https://sigaa.ifsc.edu.br'
  })

  const account = await sigaa.login(storage.credentials.username, storage.credentials.password) // login
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
        const msg = `${textUtils.getPrettyClassName(classStudent.title)}\n\n` +
          `${news.title}\n\n` +
          `${await news.getContent()}\n\n` +
          `Enviado em ${news.date} às ${await news.getTime()}`
        await telegram.sendMessage(storage.credentials.chatId, msg)
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
