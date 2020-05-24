const { Model, DataTypes } = require('sequelize')

class Program extends Model {
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
    Program.hasMany(models.StudentProfile, { foreignKey: 'program_id' })
  }
}

module.exports = Program
