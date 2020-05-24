const { Model, DataTypes } = require('sequelize')

class ReferenceType extends Model {
  static init(sequelize) {
    super.init(
      {
        name: {
          type: DataTypes.STRING,
          unique: true
        }
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    ReferenceType.belongsToMany(models.Reference, {
      through: 'type_references',
      foreignKey: 'type_id'
    })
  }
}

module.exports = ReferenceType
