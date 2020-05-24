module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('courses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      institutional_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      abbreviation: {
        type: Sequelize.STRING,
        allowNull: false
      },
      period: {
        type: Sequelize.STRING,
        allowNull: false
      },
      methods: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      assessment_procedures: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      attendance_schedule: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('courses')
  }
}
