const Sigaa = require('sigaa-api')
const config = require('../config')
const sendLog = require('./sendLog')

async function classTeacherMembers (storage) {
  console.log('loading teacher members')
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
      console.error(err)
      sendLog.sendError(err)
    }
  }
  storage.saveData('members', data)
  console.log('finished loading teacher members')
}

module.exports = classTeacherMembers
