const Telegraf = require('telegraf')
const config = require('../config')
const SendLog = require('../libs/send-log')
const bot = new Telegraf(process.env.BOT_TOKEN)

const AttendanceScheduleCommand = require('./attendance-schedule')
const CalendarSearchCommand = require('./calendar-search')
const SyllabusCommand = require('./syllabus')
const EmailSearchCommand = require('./email-search')
const ForceUpdateCommand = require('./force-update')
const StartCommand = require('./start')
const ViewGradesCommand = require('./view-grades')

const accessControlAllowlist = (config) => {
  if (config.allowlistEnable) {
    bot.command(config.command, (ctx, next) => {
      if (config.allowlist.indexOf(ctx.message.chat.id) > -1) {
        next()
      } else {
        if (config.denyMsg) {
          ctx.reply(config.denyMsg)
          if (ctx.chat.type === 'private') {
            const msg = `Command /${config.command} denied access for user ${ctx.message.from.username} in private chat, add ${ctx.message.chat.id} to allow the user`
            SendLog.info(msg)
          } else {
            const msg = `Command /${config.command} denied access for user ${ctx.message.from.username} in ${ctx.chat.title} ${ctx.chat.type}, add ${ctx.message.chat.id} to allow the ${ctx.chat.type}`
            SendLog.info(msg)
          }
        }
      }
    })
  }
}

const commands = {
  attendanceSchedule: AttendanceScheduleCommand,
  calendarSearch: CalendarSearchCommand,
  syllabus: SyllabusCommand,
  emailSearch: EmailSearchCommand,
  forceUpdate: ForceUpdateCommand,
  start: StartCommand,
  viewGrades: ViewGradesCommand
}

for (const command in commands) {
  const configCommand = config.commands[command]
  if (configCommand && configCommand.enable) {
    accessControlAllowlist(configCommand)
    new commands[command](bot, configCommand)
    SendLog.info(`Command ${command} actived`, {
      sendToTelegram: false
    })
  }
}

bot.launch()
