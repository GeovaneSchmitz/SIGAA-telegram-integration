const { Model, DataTypes } = require('sequelize')

class Grade extends Model {
  static init(sequelize) {
    super.init(
      {
        courseId: DataTypes.INTEGER,
        name: DataTypes.STRING,
        value: DataTypes.DOUBLE
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    Grade.belongsTo(models.Course, { foreignKey: 'course_id' })
    Grade.hasMany(models.SubGrade, { foreignKey: 'grade_id' })
  }
}

module.exports = Grade
