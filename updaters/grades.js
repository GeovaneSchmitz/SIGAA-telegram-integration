const { Op } = require('sequelize')

const TextUtils = require('../libs/text-utils')
const sequelize = require('../libs/sequelize')
const TelegramUtils = require('../libs/telegram-utils')

/**
 * @description updater course grades in database and send messagem with grade notification
 * @param {import('../models/course')} dbCourse
 * @param {import('sigaa-api').SigaaCourseStudent} course
 */
const updaterGrades = async (dbCourse, course) => {
  const { Grade, SubGrade } = sequelize.models

  const grades = await course.getGrades()

  const gradesStack = []
  const usedGrades = []
  const usedSubGrades = []
  for (const grade of grades) {
    const gradeStack = []
    const dbGrade = await Grade.findOne({
      where: {
        courseId: dbCourse.id,
        name: grade.name
      }
    })

    if (dbGrade) {
      usedGrades.push(dbGrade.id)
    }

    if (grade.grades === undefined && grade.value !== null) {
      if (!dbGrade) {
        gradeStack.push('Nota adicionada')
      }

      if (dbGrade && dbGrade.value !== grade.value) {
        gradeStack.push('Valor alterado')
      }
    }

    if (!dbGrade && grade.grades !== undefined) {
      for (const subGrade of grade.grades) {
        if (subGrade.value !== null) {
          const subGradeStack = []
          subGradeStack.push(
            '*' + TextUtils.escapeMarkdownV2(subGrade.name) + '*'
          )
          subGradeStack.push('Nota adicionada')
          subGradeStack.push(
            TextUtils.escapeMarkdownV2(`Peso ${subGrade.weight}`)
          )
          const gradeMsg = subGradeStack.join('\n ')
          gradeStack.push(gradeMsg)
        }
      }
      if (grade.average !== null) {
        gradeStack.push('Média adicionada')
      }
    }

    if (dbGrade && grade.grades !== undefined) {
      for (const subGrade of grade.grades) {
        if (subGrade.value === null) {
          continue
        }
        const subGradeStack = []

        const dbSubGrade = await SubGrade.findOne({
          where: {
            gradeId: dbGrade.id,
            name: subGrade.name
          }
        })

        if (dbSubGrade) {
          usedSubGrades.push(dbSubGrade.id)
          if (dbSubGrade.value !== subGrade.value) {
            subGradeStack.push(TextUtils.escapeMarkdownV2('Nota alterada'))
          }

          if (dbSubGrade.weight !== subGrade.weight) {
            subGradeStack.push(
              TextUtils.escapeMarkdownV2(
                `Peso alterado ${dbSubGrade.weight} -> ${subGrade.weight}`
              )
            )
          }
        } else {
          subGradeStack.push(TextUtils.escapeMarkdownV2('Nota adicionada'))
          subGradeStack.push(
            TextUtils.escapeMarkdownV2(`Peso ${subGrade.weight}`)
          )
        }
        if (subGradeStack.length > 0) {
          subGradeStack.unshift(
            '*' + TextUtils.escapeMarkdownV2(subGrade.name) + '*'
          )
          const gradeMsg = subGradeStack.join('\n ')
          gradeStack.push(gradeMsg)
        }
      }

      const deletedSubGrades = await SubGrade.findAll({
        where: {
          id: {
            [Op.notIn]: usedSubGrades
          },
          gradeId: dbGrade.id
        }
      })

      for (const deletedSubGrade of deletedSubGrades) {
        const subGradeStack = []

        subGradeStack.push(TextUtils.escapeMarkdownV2('Nota removida'))
        subGradeStack.push(
          TextUtils.escapeMarkdownV2(`Peso ${deletedSubGrade.weight}`)
        )

        subGradeStack.unshift(
          '*' + TextUtils.escapeMarkdownV2(deletedSubGrade.name) + '*'
        )
        const gradeMsg = subGradeStack.join('\n ')
        gradeStack.push(gradeMsg)
      }

      if (dbGrade.value !== grade.average) {
        gradeStack.push(TextUtils.escapeMarkdownV2(`Média alterada`))
      }
    }
    if (gradeStack.length > 0) {
      gradeStack.unshift('*' + TextUtils.escapeMarkdownV2(grade.name) + '*')
      const gradeMsg = gradeStack.join('\n')
      gradesStack.push(gradeMsg)
    }
  }

  const deletedGrades = await Grade.findAll({
    where: {
      id: {
        [Op.notIn]: usedGrades
      },
      courseId: dbCourse.id
    }
  })

  for (const deletedGrade of deletedGrades) {
    const gradeStack = [
      '*' + TextUtils.escapeMarkdownV2(deletedGrade.name) + '*'
    ]
    const subGrades = await deletedGrade.getSubGrades()

    if (subGrades) {
      for (const subGrade of subGrades) {
        gradeStack.push('*' + TextUtils.escapeMarkdownV2(subGrade.name) + '*')
        gradeStack.push(TextUtils.escapeMarkdownV2('Nota removida'))
        gradeStack.push(TextUtils.escapeMarkdownV2(`Peso ${subGrade.weight}`))
      }
      gradeStack.push(TextUtils.escapeMarkdownV2('Média removida'))
    } else {
      gradeStack.push(TextUtils.escapeMarkdownV2('Nota removida'))
    }

    const gradeMsg = gradeStack.join('\n ')
    gradesStack.push(gradeMsg)
  }

  if (gradesStack.length > 0) {
    let msg = gradesStack.join('\n\n')
    msg =
      TextUtils.escapeMarkdownV2(TextUtils.getPrettyCourseTitle(course.title)) +
      '\n' +
      msg

    await TelegramUtils.sendNotificationMessage(msg, {
      parse_mode: 'MarkdownV2'
    })
    const usedGrades = []
    await Promise.all(
      grades.map(async (grade) => {
        if (!grade.average && !grade.value) {
          return false
        }
        const gradeValue = grade.value || grade.average

        const [dbGrade, created] = await Grade.findOrCreate({
          where: {
            courseId: dbCourse.id,
            name: grade.name
          },
          defaults: {
            courseId: dbCourse.id,
            name: grade.name,
            value: gradeValue
          }
        })
        if (!created) {
          await Grade.update(
            {
              id: dbGrade.id,
              name: grade.name,
              value: gradeValue
            },
            {
              where: {
                id: dbGrade.id
              }
            }
          )
        }
        usedGrades.push(dbGrade.id)
        const usedSubGrades = []
        if (grade.grades !== undefined) {
          for (const subGrade of grade.grades) {
            if (subGrade.value === null) continue
            const [dbSubGrade, created] = await SubGrade.findOrCreate({
              where: {
                gradeId: dbGrade.id,
                name: subGrade.name
              },
              defaults: {
                gradeId: dbGrade.id,
                name: subGrade.name,
                weight: subGrade.weight,
                value: subGrade.value
              }
            })
            usedSubGrades.push(dbSubGrade.id)
            if (!created) {
              await SubGrade.update(
                {
                  id: dbSubGrade.id,
                  name: subGrade.name,
                  weight: subGrade.weight,
                  value: subGrade.value
                },
                {
                  where: {
                    id: dbSubGrade.id
                  }
                }
              )
            }
          }
          await SubGrade.destroy({
            where: {
              gradeId: dbGrade.id,
              id: { [Op.notIn]: usedSubGrades }
            }
          })
        }
      })
    )

    await Grade.destroy({
      where: {
        courseId: dbCourse.id,
        id: { [Op.notIn]: usedGrades }
      }
    })
  }
}

module.exports = updaterGrades
