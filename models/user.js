const { Model, DataTypes } = require('sequelize')

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: DataTypes.STRING,
        username: {
          type: DataTypes.STRING,
          unique: true
        },
        photoId: DataTypes.INTEGER
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    User.belongsTo(models.File, { foreignKey: 'photo_id' })
    User.hasMany(models.Email, { foreignKey: 'user_id' })
    User.hasMany(models.TeacherProfile, { foreignKey: 'user_id' })
    User.hasMany(models.StudentProfile, { foreignKey: 'user_id' })
  }
}

module.exports = User
