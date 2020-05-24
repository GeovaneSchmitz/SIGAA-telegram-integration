const sequelize = require('../libs/sequelize')
const TextUtils = require('../libs/text-utils')

/**
 * create or update course record in database
 * @param {import('sigaa-api').SigaaCourseStudent} course
 * @return {import('../models/course')}
 */
const updaterCourse = async (course) => {
  const { Course } = sequelize.models

  const [dbCourse] = await Course.findOrCreate({
    where: {
      institutionalId: course.id
    },
    defaults: {
      institutionalId: course.id,
      title: course.title,
      code: course.code,
      abbreviation: TextUtils.getAbbreviationFromCode(course.code),
      period: course.period
    }
  })

  let shouldUpdate = false
  if (course.title !== dbCourse.title) {
    dbCourse.set('title', course.title)
    shouldUpdate = true
  }

  const abbreviation = TextUtils.getAbbreviationFromCode(course.code)
  if (course.code !== dbCourse.code || course.abbreviation != abbreviation) {
    dbCourse.set('abbreviation', abbreviation)
    dbCourse.set('code', course.code)
    shouldUpdate = true
  }

  if (course.code !== dbCourse.code) {
    dbCourse.set('code', course.code)
    shouldUpdate = true
  }

  if (course.period !== dbCourse.period) {
    dbCourse.set('period', course.period)
    shouldUpdate = true
  }
  if (shouldUpdate) {
    await dbCourse.save()
  }
  return dbCourse
}

module.exports = updaterCourse
