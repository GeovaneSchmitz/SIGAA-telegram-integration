module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`CREATE EXTENSION unaccent;`, {
        transaction: t
      })

      await queryInterface.sequelize.query(
        `CREATE TEXT SEARCH CONFIGURATION portuguesedict(COPY = portuguese);`,
        {
          transaction: t
        }
      )

      await queryInterface.sequelize.query(
        `ALTER TEXT SEARCH CONFIGURATION portuguesedict
        ALTER MAPPING FOR hword, hword_part, word
        WITH unaccent, portuguese_stem;`,
        {
          transaction: t
        }
      )
    })
  },

  down: (queryInterface) =>
    queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `DROP TEXT SEARCH CONFIGURATION portuguesedict;`,
        {
          transaction: t
        }
      )
      await queryInterface.sequelize.query(`DROP EXTENSION unaccent;`, {
        transaction: t
      })
    })
}
