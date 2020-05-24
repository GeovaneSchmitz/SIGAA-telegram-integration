const sequelize = require('../libs/sequelize')
const SendLog = require('../libs/send-log')

/**
 * syllabus Command
 * look for the attendence
 */
class syllabusCommand {
  constructor(bot, commandConfig) {
    bot.action(/^syllabus:[\s\S]*$/i, async (ctx) => {
      try {
        ctx.replyWithChatAction('typing')
        const { Syllabus } = sequelize.models
        const id = parseInt(ctx.callbackQuery.data.match(/[0-9]*$/g)[0], 10)
        const syllabus = await Syllabus.findOne({
          where: {
            courseId: id
          },
          order: [['updatedAt', 'DESC']]
        })

        ctx.answerCbQuery('')
        ctx.replyWithDocument(syllabus.telegramId)
      } catch (err) {
        await SendLog.error(err)
      }
    })

    bot.command(commandConfig.command, async (ctx) => {
      try {
        ctx.replyWithChatAction('typing')

        const { Course, Syllabus } = sequelize.models

        const { period } = await Course.findOne({
          order: [['period', 'DESC']]
        })
        const courses = await Course.findAll({
          where: { period },
          include: [{ model: Syllabus, required: true }],
          order: [['title', 'ASC']]
        })
        const keyboardMakeup = []
        let row = []
        for (const course of courses) {
          row.push({
            text: course.abbreviation,
            callback_data: 'syllabus:' + course.id
          })
          if (row.length == 3) {
            keyboardMakeup.push(row)
            row = []
          }
        }
        if (row.length > 0) {
          keyboardMakeup.push(row)
        }
        if (courses.length > 0) {
          ctx.reply(commandConfig.courseListMsg, {
            reply_markup: { inline_keyboard: keyboardMakeup }
          })
        } else {
          ctx.reply(commandConfig.noResultsMsg)
        }
      } catch (err) {
        await SendLog.error(err)
      }
    })
  }
}

module.exports = syllabusCommand
