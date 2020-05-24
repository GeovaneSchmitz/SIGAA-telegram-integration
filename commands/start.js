/**
 * start command
 * display the list of commands
 */
class startCommand {
  constructor(bot, commandConfig) {
    bot.command(commandConfig.command, (ctx) => {
      if (commandConfig.startMsg) {
        ctx.reply(commandConfig.startMsg)
      }
    })
  }
}

module.exports = startCommand
