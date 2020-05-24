const Sigaa = require('sigaa-api')
const sequelize = require('../libs/sequelize')
const Teacher = require('../libs/teacher')
/**
 * app config file
 */
const config = require('../config')

/**
 * Class to search content
 */
class Search {
  /**
   * Lookup teacher in sigaa
   * @param {string} searchTerm
   * @returns {Promise<Array<Teacher>>}
   */
  static async searchTeacherInSigaa(searchTerm) {
    const limit = config.search.maxResultAmount + 1
    const sigaa = new Sigaa({
      url: config.sigaa.url
    })
    const searchTeacher = sigaa.search.teacher()
    const campusList = await searchTeacher.getCampusList()
    const campus = config.search.campusFilter
      ? campusList.find((campus) =>
          campus.name.includes(config.search.campusFilter)
        ) || null
      : null
    const result = await searchTeacher.search(searchTerm, campus)

    if (result.length > limit) {
      result.splice(limit, result.length)
    }
    return Search._parseTeacherSearchInSigaa(result)
  }

  /**
   * Lookup teacher in Database
   * @param {string} searchTerm
   * @returns {Promise<Array<Teacher>>}
   */
  static async searchDbTeachers(searchTerm) {
    const { User, Email, Department, TeacherProfile } = sequelize.models

    const dbTeachers = await TeacherProfile.search(searchTerm)

    const teacherCourses = await Promise.all(
      dbTeachers.map((teacher) => teacher.getCourses())
    )

    const courseTitles = teacherCourses.map((teacherCourses) =>
      teacherCourses.map((course) => course.title)
    )

    for (const i in dbTeachers) {
      dbTeachers[i].courseTitles = courseTitles[i]
    }

    const [users, departments] = await Promise.all([
      Promise.all(
        dbTeachers.map((teacher) =>
          User.findByPk(teacher.userId, {
            include: [{ model: Email }]
          })
        )
      ),
      Promise.all(
        dbTeachers.map((teacher) => Department.findByPk(teacher.departmentId))
      )
    ])

    const teachers = []
    for (const i in dbTeachers) {
      const teacher = new Teacher()
      teacher.name = users[i].name
      teacher.department = departments[i].name
      teacher.courseTitles = dbTeachers[i].courseTitles
      teacher.emails = users[i].Emails.map((email) => {
        return {
          email: email.email,
          isVerified: email.isVerified
        }
      })
      teachers.push(teacher)
    }

    return teachers
  }

  /**
   * Search in Sigaa for the search term
   * @param {Array<Sigaa.SigaaSearchTeacherResult>} teachersInSigaa
   * @returns {Promise<Array<Teacher>>}
   */
  static async _parseTeacherSearchInSigaa(teachersInSigaa) {
    return Promise.all(
      teachersInSigaa.map(async (teacherInSigaa) => {
        const teacher = new Teacher()
        teacher.name = teacherInSigaa.name
        teacher.department = teacherInSigaa.department
        const email = await teacherInSigaa.getEmail()
        if (email) {
          teacher.emails = [{ email, isVerified: true }]
        }
        return teacher
      })
    )
  }
}

module.exports = Search
