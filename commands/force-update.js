const Updaters = require('../updaters')

/**
 * start update database and notify
 */
class forceUpdateCommand {
  constructor(bot, commandConfig) {
    bot.command(commandConfig.command, async (ctx) => {
      if (commandConfig.startMsg) {
        ctx.reply(commandConfig.startMsg)
      }
      try {
        await Updaters({
          sendLogToTelegram: true,
          chatId: ctx.chat.id
        })
      } finally {
        if (commandConfig.endMsg) {
          ctx.reply(commandConfig.endMsg)
        }
      }
    })
  }
}

module.exports = forceUpdateCommand
