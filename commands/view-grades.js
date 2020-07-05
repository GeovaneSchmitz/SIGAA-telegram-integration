const SendLog = require('../libs/send-log')
const TextUtils = require('../libs/text-utils')
const sequelize = require('../libs/sequelize')

/**
 * app config file
 */
const config = require('../config')

/**
 * View Grade command
 * view course grades
 */
class ViewGradeCommand {
  constructor(bot, commandConfig) {
    bot.command(commandConfig.command, async (ctx) => {
      try {
        ctx.replyWithChatAction('typing')
        const { Course, Grade, SubGrade } = sequelize.models
        const message = ctx.message
        const searchIndex = message.text.indexOf(' ')

        if (searchIndex === -1) {
          const { period } = await Course.findOne({
            order: [['period', 'DESC']]
          })
          const courses = await Course.findAll({
            where: { period },
            include: [
              {
                model: Grade,
                required: true,
                include: [
                  {
                    model: SubGrade
                  }
                ]
              }
            ],
            order: [['title', 'ASC']]
          })
          if (courses.length === 0) {
            if (commandConfig.noGradesMsg) {
              ctx.reply(commandConfig.noGradesMsg)
            }
          } else {
            ctx.reply(ViewGradeCommand.createGradeListMessage(courses))
          }
        } else {
          const searchTerm = message.text.slice(message.text.indexOf(' ') + 1)
          const responsesStack = []
          const results = await Course.search(searchTerm)
          const coursesIds = results.map((course) => course.id)
          const courses = await Course.findAll({
            where: { id: coursesIds },
            include: [
              {
                model: Grade,
                required: true,
                include: [
                  {
                    model: SubGrade
                  }
                ]
              }
            ],
            order: [['title', 'ASC']]
          })
          let limited = false
          if (courses.length > config.search.maxResultAmount) {
            limited = true
            courses.splice(config.search.maxResultAmount, courses.length)
          }
          responsesStack.push(ViewGradeCommand.createGradeListMessage(courses))

          if (courses.length === 0 && commandConfig.noResultsMsg) {
            responsesStack.push(commandConfig.noResultsMsg)
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
   * @param {Array<import('../models/course')>} courses array with teacher profile
   * @returns {Promise<String>}
   */
  static createGradeListMessage(courses) {
    const messageStack = []
    for (const course of courses) {
      const courseStack = []

      const title = TextUtils.getPrettyCourseTitle(course.title)
      courseStack.push(title)

      for (const grade of course.Grades) {
        if (grade.SubGrades.length == 0) {
          if (grade.value !== null) {
            const gradeName = TextUtils.toTitleCase(grade.name)
            const gradeMsg = `${gradeName}: ${grade.value}`
            courseStack.push(gradeMsg)
          }
        } else {
          const subGradeStack = []
          for (const subGrade of grade.SubGrades) {
            if (subGrade.value !== null) {
              const subGradeName = TextUtils.toTitleCase(subGrade.name)
              const subGradeMsg = `  ${subGradeName}, peso ${subGrade.weight} e valor ${subGrade.value}`
              subGradeStack.push(subGradeMsg)
            }
          }
          if (subGradeStack.length > 0 || grade.value !== null) {
            const gradeName = TextUtils.toTitleCase(grade.name)
            courseStack.push(gradeName)
          }
          if (subGradeStack.length > 0) {
            courseStack.push(subGradeStack.join('\n'))
          }
          if (grade.value !== null) {
            const gradeMsg = `Média: ${grade.value}`
            courseStack.push(gradeMsg)
          }
        }
      }

      messageStack.push(courseStack.join('\n'))
    }

    return messageStack.join('\n\n')
  }
}

module.exports = ViewGradeCommand
