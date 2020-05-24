const { Model, DataTypes } = require('sequelize')

class Video extends Model {
  static init(sequelize) {
    super.init(
      {
        lessonId: DataTypes.INTEGER,
        title: DataTypes.TEXT,
        url: DataTypes.STRING,
        body: DataTypes.TEXT
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    Video.belongsTo(models.Lesson, { foreignKey: 'lesson_id' })
  }
}

module.exports = Video
