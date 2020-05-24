const { Model, DataTypes } = require('sequelize')

class StudentProfile extends Model {
  static init(sequelize) {
    super.init(
      {
        userId: {
          type: DataTypes.INTEGER,
          unique: true
        },
        programId: DataTypes.INTEGER,
        registrationCode: DataTypes.STRING
      },
      {
        sequelize
      }
    )
  }

  static associate(models) {
    StudentProfile.belongsTo(models.User, { foreignKey: 'user_id' })
    StudentProfile.belongsTo(models.Program, { foreignKey: 'program_id' })
    StudentProfile.belongsToMany(models.Course, {
      through: 'student_courses',
      foreignKey: 'student_id'
    })
  }
}

module.exports = StudentProfile
