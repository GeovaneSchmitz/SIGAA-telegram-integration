const vectorName = '_search'

const searchObjects = {
  courses: [
    { name: 'title', weight: 'A' },
    { name: 'abbreviation', weight: 'A' },
    { name: 'code', weight: 'B' },
    { name: 'period', weight: 'D' },
    { name: 'methods', weight: 'D' },
    { name: 'assessment_procedures', weight: 'D' },
    { name: 'attendance_schedule', weight: 'D' }
  ],
  news: [
    { name: 'title', weight: 'A' },
    { name: 'body', weight: 'D' }
  ],
  homework: [
    { name: 'title', weight: 'A' },
    { name: 'body', weight: 'D' }
  ],
  files: [
    { name: 'title', weight: 'A' },
    { name: 'filename', weight: 'B' },
    { name: 'description', weight: 'B' }
  ],
  references: [{ name: 'body', weight: 'A' }],
  lessons: [
    { name: 'title', weight: 'A' },
    { name: 'body', weight: 'D' }
  ],
  users: [
    { name: 'name', weight: 'A' },
    { name: 'username', weight: 'D' }
  ]
}

/**
 * Generate SQL for searchable column
 * @param {string} tableName
 * @param {object} column
 * @param {string} column.name
 * @param {string} column.weight
 * @returns {string}
 */
const generateSQLForColumn = (tableName, column) => {
  return `setweight(to_tsvector('portuguesedict', coalesce("${tableName}".${column.name},'')), '${column.weight}')`
}

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      return Promise.all(
        Object.keys(searchObjects).map(async (table) => {
          await queryInterface.sequelize.query(
            `ALTER TABLE "${table}" ADD COLUMN ${vectorName} TSVECTOR;`,
            { transaction: t }
          )

          await queryInterface.sequelize.query(
            `CREATE FUNCTION ${table}${vectorName}_trigger() RETURNS trigger AS ' BEGIN new.${vectorName} := ${searchObjects[
              table
            ]
              .map((column) => generateSQLForColumn('new', column))
              .join(' || ')
              .replace(/'/g, "''")}; RETURN new; END;' LANGUAGE plpgsql;`,
            { transaction: t }
          )

          await queryInterface.sequelize.query(
            `UPDATE "${table}" SET ${vectorName} = ${searchObjects[table]
              .map((column) => generateSQLForColumn(table, column))
              .join(' || ')};`,
            { transaction: t }
          )

          await queryInterface.sequelize.query(
            `CREATE INDEX ${table}${vectorName} ON "${table}" USING gin(${vectorName});`,
            { transaction: t }
          )

          await queryInterface.sequelize.query(
            `CREATE TRIGGER ${table}${vectorName}_update
            BEFORE INSERT OR UPDATE ON "${table}"
            FOR EACH ROW EXECUTE PROCEDURE ${table}${vectorName}_trigger();`,
            { transaction: t }
          )
        })
      )
    })
  },

  down: (queryInterface) =>
    queryInterface.sequelize.transaction(async (t) => {
      await Promise.all(
        Object.keys(searchObjects).map(async (table) => {
          await queryInterface.sequelize.query(
            `DROP TRIGGER ${table}${vectorName}_update ON "${table}";`,
            {
              transaction: t
            }
          )

          await queryInterface.sequelize.query(
            `DROP INDEX ${table}${vectorName};`,
            {
              transaction: t
            }
          )

          await queryInterface.sequelize.query(
            `DROP FUNCTION ${table}${vectorName}_trigger()`,
            {
              transaction: t
            }
          )

          await queryInterface.sequelize.query(
            `ALTER TABLE "${table}" DROP COLUMN ${vectorName};`,
            { transaction: t }
          )
        })
      )
    })
}
