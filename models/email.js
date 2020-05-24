const { Model, DataTypes } = require('sequelize')

class Email extends Model {
  static init(sequelize) {
    super.init(
      {
        userId: DataTypes.INTEGER,
        email: DataTypes.STRING,
        isVerified: DataTypes.BOOLEAN
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    Email.belongsTo(models.User, { foreignKey: 'user_id' })
  }
}

module.exports = Email
