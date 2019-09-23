const Sigaa = require('sigaa-api')

async function classTeacherMembers (storage) {
  console.log('loading teacher members')
  const sigaa = new Sigaa({
    url: process.env.SIGAA_URL
  })
  const account = await sigaa.login(process.env.SIGAA_USERNAME, process.env.SIGAA_PASSWORD) // login
  const classes = await account.getClasses() // this return a array with all classes
  const data = storage.getData('members')
  for (const classStudent of classes) { // for each class
    try {
      var members = await classStudent.getMembers() // this lists all members
      data[classStudent.id] = {
        className: classStudent.title,
        teachers: members.teachers
      }
    } catch (err) {
      console.log(err)
    }
  }
  storage.saveData('members', data)
  console.log('finished loading teacher members')
}

module.exports = classTeacherMembers
