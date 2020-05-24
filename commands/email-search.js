const SendLog = require('../libs/send-log')
const Search = require('../libs/search')
const TextUtils = require('../libs/text-utils')
const sequelize = require('../libs/sequelize')
const Teacher = require('../libs/teacher')

/**
 * app config file
 */
const config = require('../config')

const emailEmoji = '\uD83D\uDCE7'
const questionMarkEmoji = '\u2754'
const starEmoji = '\u2B50'

/**
 * Email search command
 * search for teachers email
 */
class EmailSearchCommand {
  constructor(bot, commandConfig) {
    bot.action(/^email:[\s\S]*$/i, async (ctx) => {
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
          const msg = EmailSearchCommand.createEmailListMessage(
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
              callback_data: 'email:' + course.id
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
          if (teachers.length > 0) {
            responsesStack.push(
              EmailSearchCommand.createEmailListMessage(teachers, commandConfig)
            )
          }

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
   * Create Email list message
   * @param {Array<Teacher>} teachers array with teacher profile
   * @param {Object} commandConfig Command Email config
   * @returns {Promise<String>}
   */
  static createEmailListMessage(teachers, commandConfig) {
    let questionMarkEmojiLabel = false
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
        teacherStack.push(commandConfig.emailUnavailableMsg)
      } else {
        const verifiedEmail = teacher.emails.filter((email) => email.isVerified)
        for (const email of verifiedEmail) {
          teacherStack.push(`${emailEmoji} ${email.email}`)
        }

        const notVerifiedEmail = teacher.emails.filter(
          (email) => !email.isVerified
        )

        if (notVerifiedEmail.length > 0) {
          questionMarkEmojiLabel = true
        }

        for (const email of notVerifiedEmail) {
          teacherStack.push(`${questionMarkEmoji} ${email.email}`)
        }
      }

      messageStack.push(teacherStack.join('\n'))
    }
    if (questionMarkEmojiLabel && commandConfig.possibleEmails) {
      messageStack.push(`${questionMarkEmoji} ${commandConfig.possibleEmails}`)
    }
    return messageStack.join('\n\n')
  }
}

module.exports = EmailSearchCommand
