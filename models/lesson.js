const { Model, DataTypes } = require('sequelize')

class Lesson extends Model {
  static init(sequelize) {
    super.init(
      {
        courseId: DataTypes.INTEGER,
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
    Lesson.belongsTo(models.Course, { foreignKey: 'course_id' })
    Lesson.hasMany(models.Homework, { foreignKey: 'lesson_id' })
    Lesson.hasMany(models.Quiz, { foreignKey: 'lesson_id' })
    Lesson.hasMany(models.Content, { foreignKey: 'lesson_id' })
    Lesson.hasMany(models.Video, { foreignKey: 'lesson_id' })
    Lesson.hasMany(models.ScheduledChat, { foreignKey: 'lesson_id' })
  }
}

module.exports = Lesson
