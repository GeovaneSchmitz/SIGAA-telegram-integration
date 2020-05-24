const { Model, DataTypes } = require('sequelize')

class Reference extends Model {
  static init(sequelize) {
    super.init(
      {
        courseId: DataTypes.INTEGER,
        body: DataTypes.TEXT
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    Reference.belongsTo(models.Course, { foreignKey: 'course_id' })
    Reference.belongsToMany(models.ReferenceType, {
      through: 'type_references',
      foreignKey: 'reference_id'
    })
  }
}

module.exports = Reference
