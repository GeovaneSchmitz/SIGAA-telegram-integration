const telegram = require('./telegram')

/**
 * app config file
 */
const config = require('../config')

/**
 * @description class to add useful telegram methods
 */
class TelegramUtil {
  /**
   * Send same message to Serveral Chats
   * @param {Array<string>} chatIds array of chat id
   * @param {string} msg message to send
   * @param {object} [options] message telegram options
   * @async
   */
  static async sendSameMessagemToSeveralChats(chatIds, msg, options) {
    const messageResults = []
    for (const chatId of chatIds) {
      const result = await telegram.sendMessage(chatId, msg, options)
      messageResults.push(result)
    }
    return messageResults
  }

  /**
   * Send message to all chats in the notification list
   * @param {string} msg
   * @param {object} [options] message telegram options
   */
  static async sendNotificationMessage(msg, options) {
    const chatIds = config.notifications.chatIds
    return TelegramUtil.sendSameMessagemToSeveralChats(chatIds, msg, options)
  }

  /**
   * Send file to all chats in the notification list
   * @see https://telegraf.js.org/#/?id=senddocument
   * @see https://core.telegram.org/bots/api#senddocument
   * @param {object} document telegraf document parameter
   * @param {object} [extra] telegram extra fields
   * @param {object} [replyMessageIds] If the message is a reply, Ids of the original message, object with key as chatId and value as message Id
   * @returns {string} telegram file id
   */
  static async sendNotificationDocument(document, extra, replyMessageIds) {
    const chatIds = config.notifications.chatIds
    let telegramFileId = null
    for (const chatId of chatIds) {
      if (!telegramFileId) {
        const telegramFile = await telegram.sendDocument(chatId, document, {
          extra,
          reply_to_message_id: replyMessageIds ? replyMessageIds[chatId] : null
        })
        telegramFileId = telegramFile.document['file_id']
      } else {
        await telegram.sendDocument(chatId, telegramFileId, {
          extra,
          reply_to_message_id: replyMessageIds ? replyMessageIds[chatId] : null
        })
      }
    }
    return telegramFileId
  }

  /**
   * Sends message to the entire chat in the log list
   * @param {string} msg
   */
  static async sendLogMessage(msg) {
    const chatIds = config.logs.chatIds
    return TelegramUtil.sendSameMessagemToSeveralChats(chatIds, msg)
  }
}

module.exports = TelegramUtil
