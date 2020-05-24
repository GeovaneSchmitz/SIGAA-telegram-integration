const { Model, DataTypes } = require('sequelize')

class File extends Model {
  static init(sequelize) {
    super.init(
      {
        institutionalId: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false
        },
        institutionalKey: {
          type: DataTypes.STRING,
          allowNull: false
        },
        filename: DataTypes.STRING,
        title: DataTypes.TEXT,
        description: DataTypes.TEXT,
        telegramId: DataTypes.STRING
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    File.hasMany(models.User, { foreignKey: 'photo_id' })
    File.hasMany(models.Homework, { foreignKey: 'file_id' })
    File.belongsToMany(models.Course, {
      through: 'course_files',
      foreignKey: 'file_id'
    })
  }
}

module.exports = File
