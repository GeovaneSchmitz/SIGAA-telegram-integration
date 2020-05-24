const { Model, DataTypes } = require('sequelize')

class Department extends Model {
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
    Department.hasMany(models.TeacherProfile, { foreignKey: 'department_id' })
  }
}

module.exports = Department
