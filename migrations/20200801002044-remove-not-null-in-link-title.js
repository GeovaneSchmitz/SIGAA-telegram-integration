'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('links', 'title', {
      type: Sequelize.TEXT,
      allowNull: true
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('links', 'title', {
      type: Sequelize.TEXT,
      allowNull: false
    })
  }
}
