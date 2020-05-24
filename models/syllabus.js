const { Model, DataTypes } = require('sequelize')

class Syllabus extends Model {
  static init(sequelize) {
    super.init(
      {
        courseId: DataTypes.INTEGER,
        telegramId: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false
        }
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    Syllabus.belongsTo(models.Course, { foreignKey: 'course_id' })
  }
}

module.exports = Syllabus
