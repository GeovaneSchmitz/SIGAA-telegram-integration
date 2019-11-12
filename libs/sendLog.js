const config = require('../config')
const Telegram = require('telegraf/telegram')

const telegram = new Telegram(process.env.BOT_TOKEN)

const sendLog = {}

sendLog.sendError = async (err) => {
  for (const chatID of config.logs.chatIDs) {
    try {
      await telegram.sendMessage(chatID, err.stack)
    } catch (err) {
      console.error(err)
    }
  }
}
sendLog.sendInfo = async (msg) => {
  for (const chatID of config.logs.chatIDs) {
    try {
      await telegram.sendMessage(chatID, `INFO: ${msg}`)
    } catch (err) {
      console.error(err)
    }
  }
}

module.exports = sendLog
