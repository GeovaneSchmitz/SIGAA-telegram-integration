const { Model, DataTypes } = require('sequelize')

class Link extends Model {
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
    Link.belongsTo(models.Lesson, { foreignKey: 'lesson_id' })
  }
}

module.exports = Link
