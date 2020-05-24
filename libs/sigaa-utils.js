const fs = require('fs')
const path = require('path')

const TelegramUtils = require('./telegram-utils')
const TextUtils = require('./text-utils')
const SendLog = require('./send-log')
const sequelize = require('./sequelize')

/**
 * temporary directory for saving files
 */
const tmpDestiny = require('os').tmpdir()

/**
 * @description class to add useful sigaa methods
 */
class SigaaUtil {
  /**
   * Create file caption message
   * @param {Object} file SIGAA File
   * @param {string} file.filename file name
   * @param {string} file.title file title
   * @param {string} file.description file description
   * @returns {string}
   */
  static createSigaaFileCaption(file) {
    const captionStack = []

    if (file.title !== file.filename) {
      captionStack.push(file.title)
    }
    if (file.description !== file.title && file.description !== file.filename) {
      captionStack.push(file.description)
    }

    return captionStack.join('\n')
  }

  /**
   * Send file to all chats in the notification list
   * @param {Object} course
   * @param {String} course.abbreviation Course abbreviation
   * @param {import('sigaa-api').SigaaFile} file sigaa file
   * @param {object} [extra] telegram extra fields
   * @param {object} [replyMessageIds] If the message is a reply, Ids of the original message, object with key as chatId and value as message Id
   * @param {SigaaFileStudent} file SIGAA File
   *
   * @returns {import('../models/file')} the file record in database
   */
  static async sendNotificationSigaaFile(course, file, extra, replyMessageIds) {
    const { File } = sequelize.models

    const dbFile = await File.findOne({
      where: {
        institutionalId: file.id
      }
    })

    if (dbFile && dbFile.telegramId) {
      if (file.title && dbFile.title != file.title) {
        dbFile.set('title', file.title)
      }
      if (file.description && dbFile.description != file.description) {
        dbFile.set('description', file.description)
      }
      await dbFile.save()
      const caption = SigaaUtil.createSigaaFileCaption({
        filename: dbFile.filename,
        title: dbFile.title,
        description: dbFile.description
      })

      await TelegramUtils.sendNotificationDocument(
        dbFile.telegramId,
        {
          caption,
          ...extra
        },
        replyMessageIds
      )
      return dbFile
    } else {
      let filepath
      try {
        filepath = await file.download(tmpDestiny)

        const filename = path.basename(filepath)

        const filenameWithClassPrefix = TextUtils.getFilenameWithCourseAbbreviation(
          course.abbreviation,
          filename
        )
        const caption = SigaaUtil.createSigaaFileCaption({
          filename,
          title: file.title,
          description: file.description
        })
        const telegramId = await TelegramUtils.sendNotificationDocument(
          {
            source: filepath,
            filename: filenameWithClassPrefix
          },
          {
            caption,
            ...extra
          },
          replyMessageIds
        )
        if (dbFile) {
          if (filename && dbFile.filename != filename) {
            dbFile.set('filename', filename)
          }
          if (telegramId && dbFile.telegramId != telegramId) {
            dbFile.set('telegramId', telegramId)
          }
          if (file.title && dbFile.title != file.title) {
            dbFile.set('title', file.title)
          }
          if (file.description && dbFile.description != file.description) {
            dbFile.set('description', file.description)
          }
          await dbFile.save()
          return dbFile
        } else {
          return File.create({
            telegramId,
            filename,
            institutionalId: file.id,
            institutionalKey: file.key,
            title: file.title,
            description: file.description
          })
        }
      } finally {
        try {
          if (filepath) {
            fs.unlink(filepath, (err) => {
              if (err) {
                SendLog.error(err)
              }
            })
          }
        } catch (error) {
          await SendLog.error(error)
        }
      }
    }
  }
}

module.exports = SigaaUtil
