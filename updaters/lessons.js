/**
 * Copyright (c) 2020 Geovane Schmitz
 *
 * This software is released under the MIT License.
 *
 */

const { SigaaErrors } = require('sigaa-api')

const EmailLookup = require('../libs/email-lookup')
const sequelize = require('../libs/sequelize')
const TextUtils = require('../libs/text-utils')
const TelegramUtils = require('../libs/telegram-utils')
const SigaaUtils = require('../libs/sigaa-utils')
const SendLog = require('../libs/send-log')

/**
 * Update lessons in database and send messagem with lessons notification
 * @param {import('../models/course')} dbCourse
 * @param {import('sigaa-api').SigaaCourseStudent} course
 */
const updaterLessons = async (dbCourse, course) => {
  const {
    Content,
    Homework,
    Lesson,
    Link,
    Quiz,
    ScheduledChat,
    Video
  } = sequelize.models

  const prettyCourseName = TextUtils.getPrettyCourseTitle(course.title)

  /**
   * @type {Array<import('../models/lesson')>}
   */
  const lessons = await course.getLessons() // this lists all lessons

  for (const lesson of lessons) {
    // for each lesson
    try {
      let dbLesson = await Lesson.findOne({
        where: {
          courseId: dbCourse.id,
          title: lesson.title,
          body: lesson.contentText,
          startDate: lesson.startDate,
          endDate: lesson.endDate
        }
      })

      const deltaDate = Date.now() - lesson.startDate.valueOf() + 86400000 // 1 day
      if (!dbLesson && deltaDate > 0) {
        const date = TextUtils.createDatesString(
          lesson.startDate,
          lesson.endDate
        )

        const msgArray = []
        msgArray.push(prettyCourseName)
        msgArray.push(lesson.title)
        if (lesson.contentText) {
          msgArray.push(lesson.contentText)
        }
        msgArray.push(date)

        const msg = msgArray.join('\n')

        EmailLookup.lookupEmailsAndSave(dbCourse, lesson.contentText)

        TelegramUtils.sendNotificationMessage(msg)
        dbLesson = await Lesson.create({
          courseId: dbCourse.id,
          title: lesson.title,
          body: lesson.contentText,
          startDate: lesson.startDate,
          endDate: lesson.endDate
        })
      }

      for (const attachment of lesson.attachments) {
        try {
          if (attachment.type === 'quiz') {
            const foundQuiz = await Quiz.findOne({
              where: {
                institutionalId: attachment.id
              }
            })
            if (foundQuiz) {
              if (foundQuiz.lessonId !== dbLesson.id) {
                await foundQuiz.update({
                  lessonId: dbLesson.id
                })
              }
            } else {
              const quizTitle = attachment.title
              const quizStartDate = await attachment.startDate
              const quizEndDate = await attachment.endDate
              const msgArray = [`Pesquisa de ${prettyCourseName}`]
              msgArray.push(quizTitle)
              msgArray.push(
                `Período de envio ${TextUtils.createPeriodString(
                  quizStartDate,
                  quizEndDate
                )}`
              )

              const msg = msgArray.join('\n')
              await TelegramUtils.sendNotificationMessage(msg)

              await Quiz.create({
                lessonId: dbLesson.id,
                institutionalId: attachment.id,
                title: attachment.title,
                startDate: attachment.startDate,
                endDate: attachment.endDate
              })
            }
          } else if (attachment.type === 'scheduled-chat') {
            const foundScheduledChat = await ScheduledChat.findOne({
              where: {
                institutionalId: attachment.id
              }
            })

            if (foundScheduledChat) {
              if (foundScheduledChat.lessonId !== dbLesson.id) {
                await foundScheduledChat.update({
                  lessonId: dbLesson.id
                })
              }
            } else {
              const chatTitle = attachment.title
              const chatStartDate = await attachment.startDate
              const chatEndDate = await attachment.endDate
              const chatDescription = await attachment.getDescription()

              EmailLookup.lookupEmailsAndSave(dbCourse, chatDescription)

              const msgArray = [`Chat agendado de ${prettyCourseName}`]
              msgArray.push(chatTitle)
              msgArray.push(chatDescription)
              msgArray.push('')
              msgArray.push(
                `Período do chat ${TextUtils.createPeriodString(
                  chatStartDate,
                  chatEndDate
                )}`
              )
              const msg = msgArray.join('\n')
              await TelegramUtils.sendNotificationMessage(msg)

              await ScheduledChat.create({
                lessonId: dbLesson.id,
                institutionalId: attachment.id,
                title: chatTitle,
                startDate: chatStartDate,
                endDate: chatEndDate
              })
            }
          } else if (attachment.type === 'homework') {
            const foundHomework = await Homework.findOne({
              where: {
                courseId: dbCourse.id,
                institutionalId: attachment.id
              }
            })

            if (foundHomework) {
              if (foundHomework.lessonId !== dbLesson.id) {
                await foundHomework.update({
                  lessonId: dbLesson.id
                })
              }
            } else {
              const homeworkTitle = attachment.title
              const homeworkDescription = await attachment.getDescription()
              const homeworkHaveGrade = await attachment.getHaveGrade()
              const homeworkStartDate = await attachment.startDate
              const homeworkEndDate = await attachment.endDate

              EmailLookup.lookupEmailsAndSave(dbCourse, homeworkDescription)

              const msgArray = [`Tarefa de ${prettyCourseName}`]
              msgArray.push(homeworkTitle)
              msgArray.push(homeworkDescription)
              msgArray.push('')
              if (homeworkHaveGrade) {
                msgArray.push('Possui nota')
              }
              msgArray.push(
                `Período de envio ${TextUtils.createPeriodString(
                  homeworkStartDate,
                  homeworkEndDate
                )}`
              )

              const msg = msgArray.join('\n')

              const msgResults = await TelegramUtils.sendNotificationMessage(
                msg
              )
              const msgIds = msgResults.reduce((chatIds, result) => {
                chatIds[result.chat.id] = result.message_id
                return chatIds
              }, {})

              let fileId = null

              try {
                const file = await attachment.getAttachmentFile()
                const dbFile = SigaaUtils.sendNotificationSigaaFile(
                  dbCourse,
                  file,
                  {},
                  msgIds
                )
                fileId = dbFile.id
              } catch (err) {
                if (
                  err.message !==
                    SigaaErrors.SIGAA_HOMEWORK_HAS_BEEN_SUBMITTED &&
                  err.message !== SigaaErrors.SIGAA_HOMEWORK_HAS_NO_FILE
                ) {
                  throw err
                }
              }

              await Homework.create({
                lessonId: dbLesson.id,
                courseId: dbCourse.id,
                fileId,
                institutionalId: attachment.id,
                haveGrade: homeworkHaveGrade,
                startDate: homeworkStartDate,
                endDate: homeworkEndDate,
                title: homeworkTitle,
                body: homeworkDescription
              })
            }
          } else if (attachment.type === 'webcontent') {
            const foundContent = await Content.findOne({
              where: {
                institutionalId: attachment.id
              }
            })
            if (foundContent) {
              if (foundContent.lessonId !== dbLesson.id) {
                await foundContent.update({
                  lessonId: dbLesson.id
                })
              }
            } else {
              const webContentTitle = attachment.title
              const webContentBody = await attachment.getContent()
              const webcontentDate = await attachment.getDate()

              const msgArray = [prettyCourseName]
              msgArray.push(webContentTitle)
              if (attachment.description) {
                msgArray.push(attachment.description)
              }
              msgArray.push(webContentBody)
              msgArray.push(TextUtils.createDateString(webcontentDate))
              const msg = msgArray.join('\n')

              EmailLookup.lookupEmailsAndSave(dbCourse, webContentBody)

              await TelegramUtils.sendNotificationMessage(msg)

              await Content.create({
                lessonId: dbLesson.id,
                institutionalId: attachment.id,
                title: webContentTitle,
                body: attachment.description,
                postAt: webcontentDate
              })
            }
          } else if (attachment.type === 'video') {
            const foundVideo = await Video.findOne({
              where: {
                lessonId: dbLesson.id,
                url: attachment.src
              }
            })
            if (!foundVideo) {
              const videoTitle = attachment.title
              const videoDescription = attachment.description

              const msgArray = [attachment.src]
              msgArray.push(prettyCourseName)
              msgArray.push(videoTitle)
              msgArray.push(videoDescription)
              const msg = msgArray.join('\n')

              EmailLookup.lookupEmailsAndSave(dbCourse, videoDescription)

              await TelegramUtils.sendNotificationMessage(msg)

              await Video.create({
                lessonId: dbLesson.id,
                title: videoTitle,
                url: attachment.src,
                body: videoDescription
              })
            }
          } else if (attachment.type === 'link') {
            const foundLink = await Link.findOne({
              where: {
                lessonId: dbLesson.id,
                url: attachment.href
              }
            })
            if (!foundLink) {
              const linkTitle = attachment.title
              const linkDescription = attachment.description

              const msgArray = [prettyCourseName]
              msgArray.push(attachment.href)
              if (linkTitle) msgArray.push(linkTitle)
              if (linkDescription) msgArray.push(linkDescription)
              const msg = msgArray.join('\n')
              await TelegramUtils.sendNotificationMessage(msg)

              await Link.create({
                lessonId: dbLesson.id,
                title: linkTitle,
                url: attachment.href,
                body: linkDescription
              })
            }
          }
        } catch (err) {
          if (
            err.message !==
            SigaaErrors.SIGAA_SCHEDULED_CHAT_HAS_DISABLE_BY_INSTITUTION
          ) {
            await SendLog.error(err)
          }
        }
      }
    } catch (err) {
      await SendLog.error(err)
    }
  }
}

module.exports = updaterLessons
