const { Model, DataTypes } = require('sequelize')

class SubGrade extends Model {
  static init(sequelize) {
    super.init(
      {
        gradeId: DataTypes.INTEGER,
        name: DataTypes.STRING,
        value: DataTypes.DOUBLE,
        weight: DataTypes.DOUBLE
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    SubGrade.belongsTo(models.Grade, { foreignKey: 'grade_id' })
  }
}

module.exports = SubGrade
