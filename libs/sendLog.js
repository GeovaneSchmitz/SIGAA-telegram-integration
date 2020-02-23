const config = require('../config')
const Telegram = require('telegraf/telegram')

const telegram = new Telegram(process.env.BOT_TOKEN)

const sendLog = {}

sendLog._sendToTelegram = async (msg, chatId) => {
  if (chatId) {
    await telegram.sendMessage(chatId, msg)
  } else {
    for (const chatId of config.logs.chatIDs) {
      try {
        await telegram.sendMessage(chatId, msg)
      } catch (err) {
        console.error(err)
      }
    }
  }
}

sendLog.log = async (msg, { sendToTelegram, chatId } = {}) => {
  console.log(msg)
  if (sendToTelegram !== false) {
    sendLog._sendToTelegram(msg, chatId)
  }
}
sendLog.error = async (err, { sendToTelegram } = {}) => {
  console.error(err)
  if (sendToTelegram !== false) {
    sendLog._sendToTelegram(err.stack)
  }
}
sendLog.info = async (msg, { sendToTelegram } = {}) => {
  console.info(`INFO: ${msg}`)
  if (sendToTelegram !== false) {
    sendLog._sendToTelegram(`INFO: ${msg}`)
  }
}

module.exports = sendLog
