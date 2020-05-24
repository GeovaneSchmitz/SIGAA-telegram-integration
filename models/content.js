const { Model, DataTypes } = require('sequelize')

class Content extends Model {
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
        postAt: DataTypes.DATE
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    Content.belongsTo(models.Lesson, { foreignKey: 'lesson_id' })
  }
}

module.exports = Content
