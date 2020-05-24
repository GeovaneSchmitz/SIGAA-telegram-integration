const { Model, DataTypes, QueryTypes } = require('sequelize')

/**
 * app config file
 */
const config = require('../config')

class TeacherProfile extends Model {
  static init(sequelize) {
    super.init(
      {
        userId: {
          type: DataTypes.INTEGER,
          unique: true
        },
        departmentId: DataTypes.INTEGER,
        formation: DataTypes.STRING
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    TeacherProfile.belongsTo(models.User, { foreignKey: 'user_id' })
    TeacherProfile.belongsTo(models.Department, { foreignKey: 'department_id' })
    TeacherProfile.belongsToMany(models.Course, {
      through: 'teacher_courses',
      foreignKey: 'teacher_id'
    })
  }

  /**
   * Lookup teacher in database
   * @param {string} searchTerm
   * @returns {Promise<Array<TeacherProfile>>}}
   */
  static async search(searchTerm) {
    const limit = config.search.maxResultAmount + 1

    const rows = await TeacherProfile.sequelize.query(
      `SELECT * FROM (
        SELECT * FROM (
          SELECT
          teacher_profiles.id as "id",
          teacher_profiles.user_id as "userId",
          teacher_profiles.department_id as "departmentId",
          teacher_profiles.user_id as "user_id",
          teacher_profiles.department_id as "department_id",
          teacher_profiles.formation as "formation",
          coalesce(users._search, '') || ' ' || coalesce(courses._search, '') as search
          FROM teacher_profiles
          INNER JOIN users ON teacher_profiles.user_id = users.id
          INNER JOIN teacher_courses ON teacher_courses.teacher_id = teacher_profiles.id
          INNER JOIN courses ON courses.id = teacher_courses.course_id
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
    return rows.map(
      (row) =>
        new TeacherProfile(row, {
          isNewRecord: false
        })
    )
  }
}

module.exports = TeacherProfile
