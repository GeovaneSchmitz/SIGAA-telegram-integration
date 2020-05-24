const { Model, DataTypes } = require('sequelize')

class ScheduledChat extends Model {
  static init(sequelize) {
    super.init(
      {
        lessonId: DataTypes.INTEGER,
        institutionalId: {
          type: DataTypes.STRING,
          unique: true
        },
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
    ScheduledChat.belongsTo(models.Lesson, { foreignKey: 'lesson_id' })
  }
}

module.exports = ScheduledChat
