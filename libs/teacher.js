/**
 * Email object
 * @typedef {object} Email
 * @property {string} email the email
 * @property {boolean} isVerified if the email is official
 **/

/**
 * Class that represents a teacher
 */
class Teacher {
  /**
   * teacher's full name
   * @public
   * @property {string}
   * @param {string} newName
   * @throws {TEACHER_NAME_INVALID_TYPE} if invalid type
   */
  set name(newName) {
    if (typeof newName != 'string') {
      throw new Error('TEACHER_NAME_INVALID_TYPE')
    }
    this._name = newName
  }

  /**
   * @returns {string}
   */
  get name() {
    return this._name || null
  }

  /**
   * teacher's department
   * @public
   * @property {string}
   * @param {string} newDepartment
   * @throws {TEACHER_DEPARTAMENT_INVALID_TYPE} if invalid type
   */
  set department(newDepartment) {
    if (typeof newDepartment !== 'string') {
      throw new Error('TEACHER_DEPARTAMENT_INVALID_TYPE')
    }
    this._department = newDepartment
  }

  /**
   * @returns {string}
   */
  get department() {
    return this._department || null
  }

  /**
   * teacher's emails
   * @public
   * @property {Array<Email>}
   * @param {Array<Email>} newEmails
   * @throws {TEACHER_EMAIL_INVALID_TYPE} if invalid type
   */
  set emails(newEmails) {
    for (const email of newEmails) {
      if (typeof email.isVerified !== 'boolean') {
        throw new Error('TEACHER_EMAIL_INVALID_TYPE')
      }
      if (typeof email.email !== 'string') {
        throw new Error('TEACHER_EMAIL_INVALID_TYPE')
      }
    }
    this._emails = newEmails
  }
  /**
   * @returns {Array<Email>}
   */
  get emails() {
    return this._emails || null
  }

  /**
   * teacher's course titles
   * @public
   * @property {Array<String>}
   * @param {Array<String>} newCourseTitles
   * @throws {TEACHER_COURSE_TITLES_INVALID_TYPE} if invalid type
   */
  set courseTitles(newCourseTitles) {
    for (const title of newCourseTitles) {
      if (typeof title !== 'string') {
        throw new Error('TEACHER_COURSE_TITLES_INVALID_TYPE')
      }
    }
    this._courseTitles = newCourseTitles
  }
  /**
   * @returns {Array<Email>}
   */
  get courseTitles() {
    return this._courseTitles || null
  }
}

module.exports = Teacher
