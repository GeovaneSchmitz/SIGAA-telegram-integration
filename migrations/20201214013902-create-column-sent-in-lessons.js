'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addColumn(
        'lessons',
        'sent',
        Sequelize.DataTypes.BOOLEAN,
        { transaction }
      )
      await queryInterface.bulkUpdate(
        'lessons',
        { sent: true },
        {},
        {
          transaction
        }
      )
      await queryInterface.changeColumn(
        'lessons',
        'sent',
        {
          type: Sequelize.DataTypes.BOOLEAN,
          allowNull: false
        },
        { transaction }
      )
      await transaction.commit()
    } catch (err) {
      console.log(err)
      await transaction.rollback()
      throw err
    }
  },
  down: async (queryInterface) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.removeColumn('lessons', 'sent')
  }
}
