'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('grades', 'value', {
        type: Sequelize.DOUBLE,
        allowNull: true
      }),
      queryInterface.changeColumn('sub_grades', 'value', {
        type: Sequelize.DOUBLE,
        allowNull: true
      })
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('grades', 'value', {
        type: Sequelize.DOUBLE,
        allowNull: false
      }),
      queryInterface.changeColumn('sub_grades', 'value', {
        type: Sequelize.DOUBLE,
        allowNull: false
      })
    ])
  }
}
