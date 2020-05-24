const sequelize = require('./sequelize')

/**
 * Class to add e-mails found in texts in the course teacher profile
 */
class EmailLookup {
  /**
   * Lookup email in text
   * @param {string} text
   * @returns {Array<string>}
   */
  static _lookupEmailsInText(text) {
    return (
      text.match(/([a-zA-Z0-9._-]+@([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+)/gm) || []
    )
  }

  /**
   * Add emails in all teacher in course
   * @param {Set<string>} emails
   * @param {import('../models/course')} course
   *
   */
  static async _addEmailInCourseTeacher(emails, course) {
    if (emails.size > 0) {
      const { TeacherProfile, Email, User, Course } = sequelize.models

      const teachers = await TeacherProfile.findAll({
        include: [
          {
            model: User,
            required: true,
            include: [
              {
                model: Email
              }
            ]
          },
          {
            model: Course,
            required: true,
            where: {
              id: course.id
            }
          }
        ]
      })

      for (const email of emails) {
        for (const teacher of teachers) {
          const teacherHasEmail = teacher.User.Emails.some(
            (dbEmail) => email === dbEmail.email
          )
          if (!teacherHasEmail) {
            teacher.User.createEmail({ email, isVerified: false })
          }
        }
      }
    }
  }

  /**
   * Lookup email in texts and save in database
   * @param {sequelize.models.Course} course
   * @param {Array<string>} texts
   * @async
   */
  static async lookupEmailsAndSave(course, ...texts) {
    const emails = new Set(
      texts
        .map((text) => EmailLookup._lookupEmailsInText(text))
        .flat()
        .map((email) => email.toLowerCase())
    )
    return EmailLookup._addEmailInCourseTeacher(emails, course)
  }
}

module.exports = EmailLookup
