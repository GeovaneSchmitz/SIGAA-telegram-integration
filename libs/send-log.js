const telegram = require('./telegram')
const telegramUtils = require('./telegram-utils')

/**
 * @class SendLog
 * @description class to send logs to telegram and console
 */
class SendLog {
  /**
   * @description log messagem
   * @param {string} msg message
   * @param {object} [options]
   * @param {boolean} [options.sendToTelegram=true] if should send to telegram, default is true
   * @param {number} [options.chatId] telegram chat id to send messagem (default is all chatIds in config.logs.chatIds)
   * @async
   */
  static async log(msg, options) {
    const { sendToTelegram: telegram, chatId } = options || {}
    console.log(msg)
    if (telegram !== false) {
      SendLog._sendToTelegram(msg, chatId)
    }
  }

  /**
   * send a message to the chatId or, if there is
   * no chatId, send to all chat in config.log.chatIds
   * @param {string} msg
   * @param {number} [chatId]
   */
  static async _sendToTelegram(msg, chatId) {
    if (chatId) {
      try {
        await telegram.sendMessage(chatId, msg)
      } catch (err) {
        console.error(err)
      }
    } else {
      try {
        await telegramUtils.sendLogMessage(msg)
      } catch (err) {
        console.error(err)
      }
    }
  }

  /**
   * @description log error
   * @param {Error} error error
   * @param {object} [options]
   * @param {boolean} [options.sendToTelegram=true] if should send to telegram, default is true
   * @param {number} [options.chatId] telegram chat id to send messagem (default is all chatIds in config.logs.chatIds)
   * @async
   */
  static async error(err, options) {
    const { sendToTelegram } = options || { sendToTelegram: true }

    /**
     * if error is telegram too many request
     */
    if (err.message.includes('Too Many Requests') && err.code === 429) {
      const timeout = parseInt(err.description.match(/[0-9]+/g)[0], 10)
      await new Promise((resolve) => setTimeout(resolve, timeout * 1000))
    } else {
      if (sendToTelegram) {
        for (const property of Object.getOwnPropertyNames(err)) {
          if (property !== 'message') {
            console.log(`Error:${err.message}\n${property}:${err[property]}`)
            await SendLog._sendToTelegram(
              `Error:${err.message}\n${property}:${err[property]}`
            )
          }
        }
      }
    }
  }

  /**
   * @description log info messagem appedn with 'INFO:'
   * @param {string} msg message
   * @param {object} [options]
   * @param {boolean} [options.sendToTelegram] if should send to telegram, default is true
   * @param {number} [options.chatId] telegram chat id to send messagem (default is all chatIds in config.logs.chatIds)
   * @async
   */
  static async info(msg, options) {
    const { sendToTelegram: telegram } = options || {}
    console.info(`INFO: ${msg}`)
    if (telegram !== false) {
      SendLog._sendToTelegram(`INFO: ${msg}`)
    }
  }
}

module.exports = SendLog
