const SendLog = require('../libs/send-log')
const Search = require('../libs/search')
const TextUtils = require('../libs/text-utils')
const sequelize = require('../libs/sequelize')
const Teacher = require('../libs/teacher')

/**
 * app config file
 */
const config = require('../config')

const questionMarkEmoji = '\u2754'
const calendarEmoji = '\ud83d\udcc5'
const starEmoji = '\u2B50'

/**
 * Calendar Schedule Command
 * look for the teacher calendar
 */
class CalendarSearchCommand {
  constructor(bot, commandConfig) {
    bot.action(/^calendar:[\s\S]*$/i, async (ctx) => {
      try {
        ctx.replyWithChatAction('typing')
        const {
          Course,
          TeacherProfile,
          User,
          Email,
          Department
        } = sequelize.models
        const id = parseInt(ctx.callbackQuery.data.match(/[0-9]*$/g)[0], 10)
        const course = await Course.findByPk(id, {
          include: [
            {
              model: TeacherProfile,
              as: 'teachers',
              include: [
                { model: User, include: [{ model: Email }] },
                { model: Department }
              ]
            }
          ]
        })
        const teachers = course.teachers.map((dbTeacher) => {
          const teacher = new Teacher()
          teacher.name = dbTeacher.User.name
          teacher.department = dbTeacher.Department.name
          teacher.courseTitles = [course.title]
          teacher.emails = dbTeacher.User.Emails.map((email) => ({
            email: email.email,
            isVerified: email.isVerified
          }))
          return teacher
        })
        ctx.answerCbQuery('')
        if (teachers.length > 0) {
          const msg = CalendarSearchCommand.createCalendarListMessage(
            teachers,
            commandConfig
          )
          ctx.reply(msg)
        } else if (commandConfig.noResultsMsg) {
          ctx.reply(commandConfig.noResultsMsg)
        }
      } catch (err) {
        await SendLog.error(err)
      }
    })

    bot.command(commandConfig.command, async (ctx) => {
      try {
        ctx.replyWithChatAction('typing')
        const { Course } = sequelize.models
        const message = ctx.message
        const searchIndex = message.text.indexOf(' ')

        if (searchIndex === -1) {
          const { period } = await Course.findOne({
            order: [['period', 'DESC']]
          })
          const courses = await Course.findAll({
            where: { period },
            order: [['title', 'ASC']]
          })
          const keyboardMakeup = []
          let row = []
          for (const course of courses) {
            row.push({
              text: course.abbreviation,
              callback_data: 'calendar:' + course.id
            })
            if (row.length == 3) {
              keyboardMakeup.push(row)
              row = []
            }
          }
          if (row.length > 0) {
            keyboardMakeup.push(row)
          }
          ctx.reply(commandConfig.courseListMsg, {
            reply_markup: { inline_keyboard: keyboardMakeup }
          })
        } else {
          const searchTerm = message.text.slice(message.text.indexOf(' ') + 1)
          const responsesStack = []

          const teachers = await Search.searchDbTeachers(searchTerm)

          let limited = false
          if (teachers.length > config.search.maxResultAmount) {
            limited = true
            teachers.splice(config.search.maxResultAmount, teachers.length)
          } else if (teachers.length < config.search.maxResultAmount) {
            const teachersInSigaa = await Search.searchTeacherInSigaa(
              searchTerm
            )

            const sigaaTeachersRemovedDuplicate = teachersInSigaa.filter(
              (teacherInSigaa) =>
                !teachers.some(
                  (dbTeacher) => dbTeacher.name === teacherInSigaa.name
                )
            )
            sigaaTeachersRemovedDuplicate.forEach((teacher) =>
              teachers.push(teacher)
            )
            if (teachers.length > config.search.maxResultAmount) {
              limited = true
              teachers.splice(config.search.maxResultAmount, teachers.length)
            }
          }

          responsesStack.push(
            CalendarSearchCommand.createCalendarListMessage(
              teachers,
              commandConfig
            )
          )

          if (limited && commandConfig.tooManyResultsMsg) {
            responsesStack.push(commandConfig.tooManyResultsMsg)
          }

          if (responsesStack.length > 0) {
            const msg = responsesStack.join('\n\n')
            ctx.reply(msg)
          } else if (commandConfig.noResultsMsg) {
            ctx.reply(commandConfig.noResultsMsg)
          }
        }
      } catch (err) {
        await SendLog.error(err)
      }
    })
  }

  /**
   * Create Calendar list message
   * @param {Array<Teacher>} teachers array with teacher profile
   * @param {Object} commandConfig Command Calendar config
   * @returns {Promise<String>}
   */
  static createCalendarListMessage(teachers, commandConfig) {
    const messageStack = []
    for (const teacher of teachers) {
      const teacherStack = []

      const name = starEmoji + ' ' + TextUtils.toTitleCase(teacher.name)
      teacherStack.push(name)

      if (teacher.courseTitles) {
        for (const courseTitle of teacher.courseTitles) {
          teacherStack.push(TextUtils.getPrettyCourseTitle(courseTitle))
        }
      }

      const department = TextUtils.toTitleCase(teacher.department)
      teacherStack.push(department)

      if (!teacher.emails) {
        teacherStack.push(commandConfig.calendarUnavailableMsg)
      } else {
        const emailVerified = teacher.emails.find(
          (email) =>
            email.email.split('@')[1] ===
              config.ifsc.teacherDefaultEmailDomain && email.isVerified
        )
        if (emailVerified) {
          const calendarLink = commandConfig.calendarLink({
            email: emailVerified.email
          })
          teacherStack.push(`${calendarEmoji} ${calendarLink}`)
        } else {
          const emailNotVerified = teacher.emails.find(
            (email) =>
              email.email.split('@')[1] ===
              config.ifsc.teacherDefaultEmailDomain
          )
          if (emailNotVerified) {
            const calendarLink = commandConfig.calendarLink({
              email: emailNotVerified.email
            })
            teacherStack.push(`${questionMarkEmoji} ${calendarLink}`)
          } else {
            teacherStack.push(commandConfig.calendarUnavailableMsg)
          }
        }
      }

      messageStack.push(teacherStack.join('\n'))
    }

    return messageStack.join('\n\n')
  }
}

module.exports = CalendarSearchCommand
