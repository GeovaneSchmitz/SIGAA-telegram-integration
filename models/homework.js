const { Model, DataTypes } = require('sequelize')

class Homework extends Model {
  static init(sequelize) {
    super.init(
      {
        courseId: DataTypes.INTEGER,
        lessonId: DataTypes.INTEGER,
        fileId: DataTypes.INTEGER,
        institutionalId: {
          type: DataTypes.STRING,
          unique: true
        },
        haveGrade: DataTypes.BOOLEAN,
        title: DataTypes.TEXT,
        body: DataTypes.TEXT,
        startDate: DataTypes.DATE,
        endDate: DataTypes.DATE
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    Homework.belongsTo(models.Course, { foreignKey: 'course_id' })
    Homework.belongsTo(models.Lesson, { foreignKey: 'lesson_id' })
    Homework.belongsTo(models.File, { foreignKey: 'file_id' })
  }
}

module.exports = Homework
