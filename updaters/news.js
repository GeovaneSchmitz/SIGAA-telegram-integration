const TextUtils = require('../libs/text-utils')
const SendLog = require('../libs/send-log')
const TelegramUtils = require('../libs/telegram-utils')
const EmailLookup = require('../libs/email-lookup')

/**
 * @description updater course news in database and send messagem with news notification
 * @param {import('../models/course')} dbCourse
 * @param {import('sigaa-api').SigaaCourseStudent} course
 */
const updaterNews = async (dbCourse, course) => {
  const newsArray = await course.getNews() // this lists all news
  const dbNewsArray = await dbCourse.getNews()

  const dbNewsIntitutionalId = dbNewsArray.map((news) => {
    return news.institutionalId
  })

  const newNews = newsArray.filter((news) => {
    return !dbNewsIntitutionalId.includes(news.id)
  })

  // for each news
  for (const news of newNews) {
    try {
      const prettyCourseName = TextUtils.getPrettyCourseTitle(course.title)
      const newsTitle = news.title
      const newsBody = await news.getContent()
      const newsDate = await news.getDate()
      const newsDateString = `Enviado em ${TextUtils.createDateTimeString(
        newsDate
      )}`

      const msgArray = []
      msgArray.push(prettyCourseName)
      msgArray.push(newsTitle)
      msgArray.push(newsBody)
      msgArray.push(newsDateString)
      const msg = msgArray.join('\n')

      await TelegramUtils.sendNotificationMessage(msg)

      EmailLookup.lookupEmailsAndSave(dbCourse, newsBody)

      dbCourse.createNews({
        institutionalId: news.id,
        title: newsTitle,
        body: newsBody,
        postAt: newsDate
      })
    } catch (err) {
      await SendLog.error(err)
    }
  }
}

module.exports = updaterNews
