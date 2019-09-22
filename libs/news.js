const textUtils = require('./textUtils')

async function classNews (classStudent, storage, telegram) {
  const data = storage.getData('news')
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
      if (process.env.CHAT_ID1) {
        await telegram.sendMessage(process.env.CHAT_ID1, msg)
      }
      data[classStudent.id].push(news.id)
      storage.saveData('news', data)
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = classNews
