const { Model, DataTypes } = require('sequelize')

class News extends Model {
  static init(sequelize) {
    super.init(
      {
        course_id: DataTypes.INTEGER,
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
    this.belongsTo(models.Course, { foreignKey: 'course_id' })
  }
}

module.exports = News
