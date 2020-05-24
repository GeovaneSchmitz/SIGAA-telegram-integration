const { Model, DataTypes } = require('sequelize')

class Quiz extends Model {
  static init(sequelize) {
    super.init(
      {
        lessonId: DataTypes.INTEGER,
        institutionalId: {
          type: DataTypes.STRING,
          unique: true
        },
        startDate: DataTypes.DATE,
        endDate: DataTypes.DATE,
        title: DataTypes.TEXT
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    Quiz.belongsTo(models.Lesson, { foreignKey: 'lesson_id' })
  }
}

module.exports = Quiz
