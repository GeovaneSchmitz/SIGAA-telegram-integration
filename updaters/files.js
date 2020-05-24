const SendLog = require('../libs/send-log')
const SigaaUtils = require('../libs/sigaa-utils')

/**
 * @description updater class file in database and send files to telegram
 * @param {import('../models/course')} dbCourse
 * @param {import('sigaa-api').SigaaCourseStudent} course
 */
const updaterFiles = async (dbCourse, course) => {
  const files = await course.getFiles()
  const dbFiles = await dbCourse.getFiles()

  const dbFileInstitutionalId = dbFiles.map((file) => {
    return file.institutionalId
  })

  const newFiles = files.filter((file) => {
    return !dbFileInstitutionalId.includes(file.id)
  })

  for (const file of newFiles) {
    try {
      const dbFile = await SigaaUtils.sendNotificationSigaaFile(
        {
          abbreviation: dbCourse.abbreviation
        },
        file
      )
      await dbCourse.addFile(dbFile)
    } catch (err) {
      await SendLog.error(err)
    }
  }
}

module.exports = updaterFiles
