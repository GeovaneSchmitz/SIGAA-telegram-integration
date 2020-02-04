const Sigaa = require('sigaa-api')
const config = require('../config')
const sendLog = require('./sendLog')

async function classTeacherMembers (storage) {
  sendLog.log('Loading teacher members', { sendToTelegram: false })
  const sigaa = new Sigaa({
    url: config.sigaa.url
  })
  const account = await sigaa.login(process.env.SIGAA_USERNAME, process.env.SIGAA_PASSWORD) // login
  const classes = await account.getClasses() // this return a array with all classes
  const data = []
  for (const classStudent of classes) { // for each class
    try {
      var members = await classStudent.getMembers() // this lists all members
      data.push({
        className: classStudent.title,
        teachers: members.teachers
      })
    } catch (err) {
      sendLog.error(err)
    }
  }
  storage.saveData('members', data)
  sendLog.log('Finished loading teacher members', { sendToTelegram: false })
}

module.exports = classTeacherMembers
