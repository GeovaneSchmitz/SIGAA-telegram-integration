const TextUtils = require('../libs/text-utils')
const sequelize = require('../libs/sequelize')
const SendLog = require('../libs/send-log')

const { Op } = require('sequelize')

/**
 * attendance Schedule Command
 * look for the attendence
 */
class AttendanceScheduleCommand {
  constructor(bot, commandConfig) {
    bot.action(/^attendance-schelude:[\s\S]*$/i, async (ctx) => {
      try {
        ctx.replyWithChatAction('typing')
        const { Course, TeacherProfile, User } = sequelize.models
        const id = parseInt(ctx.callbackQuery.data.match(/[0-9]*$/g)[0], 10)
        const course = await Course.findByPk(id, {
          include: [
            {
              model: TeacherProfile,
              as: 'teachers',
              include: [{ model: User }]
            }
          ]
        })
        const msg = AttendanceScheduleCommand.createListMessage(
          course,
          commandConfig
        )

        ctx.answerCbQuery('')
        ctx.reply(msg)
      } catch (err) {
        await SendLog.error(err)
      }
    })

    bot.command(commandConfig.command, async (ctx) => {
      try {
        ctx.replyWithChatAction('typing')

        const { Course } = sequelize.models

        const { period } = await Course.findOne({
          order: [['period', 'DESC']]
        })
        const courses = await Course.findAll({
          where: { period, attendanceSchedule: { [Op.ne]: null } },
          order: [['title', 'ASC']]
        })
        const keyboardMakeup = []
        let row = []
        for (const course of courses) {
          row.push({
            text: course.abbreviation,
            callback_data: 'attendance-schelude:' + course.id
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
          if (commandConfig.courseListMsg) {
            ctx.reply(commandConfig.courseListMsg, {
              reply_markup: { inline_keyboard: keyboardMakeup }
            })
          }
        } else {
          if (commandConfig.noResultsMsg) {
            ctx.reply(commandConfig.noResultsMsg)
          }
        }
      } catch (err) {
        await SendLog.error(err)
      }
    })
  }

  /**
   * Create attendance list message
   * @param {import('../models/course')} course database course
   * @param {Object} commandConfig Command Calendar config
   * @returns {Promise<String>}
   */
  static createListMessage(course, commandConfig) {
    const msgStack = []
    const courseTitle = TextUtils.getPrettyCourseTitle(course.title)
    msgStack.push(courseTitle)

    if (
      course.teachers.length > 1 &&
      commandConfig.moreThanOneTeacherInCourseObservation
    ) {
      msgStack.push(commandConfig.moreThanOneTeacherInCourseObservation)
    }
    for (const teacher of course.teachers) {
      const teacherName = TextUtils.toTitleCase(teacher.User.name)
      msgStack.push(teacherName)
    }
    const attendance = TextUtils.toTitleCase(course.attendanceSchedule)
    msgStack.push(attendance)
    return msgStack.join('\n')
  }
}

module.exports = AttendanceScheduleCommand
