const { Model, DataTypes, QueryTypes } = require('sequelize')

/**
 * app config file
 */
const config = require('../config')

class Course extends Model {
  static init(sequelize) {
    super.init(
      {
        institutionalId: {
          type: DataTypes.STRING,
          unique: true
        },
        title: DataTypes.STRING,
        code: DataTypes.STRING,
        abbreviation: DataTypes.STRING,
        period: DataTypes.STRING,
        methods: DataTypes.TEXT,
        assessmentProcedures: DataTypes.TEXT,
        attendanceSchedule: DataTypes.TEXT
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    Course.hasMany(models.Lesson, { foreignKey: 'course_id' })
    Course.belongsToMany(models.TeacherProfile, {
      through: 'teacher_courses',
      foreignKey: 'course_id',
      as: 'teachers'
    })
    Course.belongsToMany(models.StudentProfile, {
      through: 'student_courses',
      foreignKey: 'course_id',
      as: 'students'
    })
    Course.hasMany(models.Homework, { foreignKey: 'course_id' })
    Course.hasMany(models.News, { foreignKey: 'course_id' })
    Course.hasMany(models.Syllabus, { foreignKey: 'course_id' })
    Course.hasMany(models.Grade, { foreignKey: 'course_id' })
    Course.hasMany(models.Reference, { foreignKey: 'course_id' })
    Course.belongsToMany(models.File, {
      through: 'course_files',
      foreignKey: 'course_id'
    })
  }

  /**
   * Lookup course in database
   * @param {string} searchTerm
   * @returns {Promise<Array<TeacherProfile>>}}
   */
  static async search(searchTerm) {
    const limit = config.search.maxResultAmount + 1

    const rows = await Course.sequelize.query(
      `SELECT * FROM (
        SELECT * FROM (
          SELECT
          id as id,
          _search as search
          FROM courses
        ) as t, to_tsquery('portuguesedict', :searchTerm) as q WHERE (t.search @@ q)
      ) as teacher
      ORDER BY ts_rank_cd(teacher.search, to_tsquery('portuguesedict', :searchTerm) ) DESC LIMIT ${limit};`,
      {
        type: QueryTypes.SELECT,
        nest: true,
        raw: true,
        replacements: {
          searchTerm: searchTerm.replace(/ /g, ' & ')
        }
      }
    )
    const ids = []
    for (const row of rows) {
      ids.push(row.id)
    }

    return Course.findAll({ id: ids })
  }
}

module.exports = Course
