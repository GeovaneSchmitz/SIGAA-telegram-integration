const Telegraf = require('telegraf')
const Sigaa = require('sigaa-api')
const textUtils = require('./textUtils')
const storage = require('./storage')

const bot = new Telegraf(process.env.BOT_TOKEN)

let usersAllowlist
if (process.env.USERS_ID_ALLOWLIST) {
  usersAllowlist = process.env.USERS_ID_ALLOWLIST.split(',')
    .map((value) => {
      return parseInt(value, 10)
    })
} else {
  usersAllowlist = false
}
const botAnswers = () => {
  bot.command('start', accessControl)
  bot.command('start', async (ctx) => {
    ctx.reply(process.env.START_MSG)
  })
  bot.command('email', async (ctx) => {
    const message = ctx.message
    const searchTerm = textUtils.removeAccents(message.text.slice(message.text.indexOf(' ') + 1).toLowerCase())
    const teacherMembersClasses = storage.getData('members')
    const keys = Object.keys(teacherMembersClasses)
    let response = ''
    let i = 0
    for (const key of keys) {
      if (i > 5) break
      const className = textUtils.removeAccents(teacherMembersClasses[key].className.toLowerCase())
      const classNamePretty = textUtils.removeAccents(textUtils.getPrettyClassName(teacherMembersClasses[key].className).toLowerCase())
      if (className.indexOf(searchTerm) > -1 || classNamePretty.indexOf(searchTerm) > -1) {
        for (const teacher of teacherMembersClasses[key].teachers) {
          const name = textUtils.toTitleCase(teacher.name)
          const department = textUtils.toTitleCase(teacher.department)
          let email
          if (teacher.email !== null) {
            email = teacher.email
          } else {
            email = process.env.EMAIL_UNAVAILABLE
          }
          response += `${textUtils.toTitleCase(className)}\n`
          response += `${name}\n`
          response += `${department}\n`
          response += `${email}\n\n`
          i++
        }
      }
    }
    const results = await searchTeacher(searchTerm)
    for (const result of results) {
      if (i > 5) break
      const name = textUtils.toTitleCase(result.name)
      const department = textUtils.toTitleCase(result.department)
      let email = await results[i].getEmail()
      if (email === null) {
        email = process.env.EMAIL_UNAVAILABLE
      }
      response += `${name}\n`
      response += `${department}\n`
      response += `${email}\n\n`
      i++
    }
    if (response !== '') {
      ctx.reply(response.slice(0, -2))
    } else {
      ctx.reply(process.env.NOT_FOUND_MSG)
    }
  })
  bot.command('agenda', accessControl)
  bot.command('agenda', async (ctx) => {
    const message = ctx.message
    const searchTerm = textUtils.removeAccents(message.text.slice(message.text.indexOf(' ') + 1).toLowerCase())
    const teacherMembersClasses = storage.getData('members')
    const keys = Object.keys(teacherMembersClasses)
    let response = ''
    let i = 0
    for (const key of keys) {
      if (i > 5) break
      const className = textUtils.removeAccents(teacherMembersClasses[key].className.toLowerCase())
      const classNamePretty = textUtils.removeAccents(textUtils.getPrettyClassName(teacherMembersClasses[key].className).toLowerCase())
      if (className.indexOf(searchTerm) > -1 || classNamePretty.indexOf(searchTerm) > -1) {
        for (const teacher of teacherMembersClasses[key].teachers) {
          const name = textUtils.toTitleCase(teacher.name)
          const department = textUtils.toTitleCase(teacher.department)
          let calendar
          if (teacher.email !== null) {
            calendar = `https://zimbra.ifsc.edu.br/service/home/${teacher.email}/atividadesIFSC.html?view=week`
          } else {
            calendar = process.env.CALENDAR_UNAVAILABLE
          }
          response += `${textUtils.toTitleCase(className)}\n`
          response += `${name}\n`
          response += `${department}\n`
          response += `${calendar}\n\n`
          i++
        }
      }
    }
    const results = await searchTeacher(searchTerm)
    for (const result of results) {
      if (i > 5) break
      const name = textUtils.toTitleCase(result.name)
      const department = textUtils.toTitleCase(result.department)
      const email = await results[i].getEmail()
      let calendar
      if (email !== null) {
        calendar = `https://zimbra.ifsc.edu.br/service/home/${email}/atividadesIFSC.html?view=week`
      } else {
        calendar = process.env.CALENDAR_UNAVAILABLE
      }
      response += `${name}\n`
      response += `${department}\n`
      response += `${calendar}\n\n`
      i++
    }
    if (response !== '') {
      ctx.reply(response.slice(0, -2))
    } else {
      ctx.reply(process.env.NOT_FOUND_MSG)
    }
  })
  bot.launch()
}

function accessControl (ctx, next) {
  const message = ctx.message
  if (usersAllowlist === false || usersAllowlist.indexOf(message.from.id) > -1) {
    next()
  } else {
    ctx.reply(process.env.DENY_MSG)
  }
}

async function searchTeacher (searchTerm) {
  const sigaa = new Sigaa({
    url: process.env.SIGAA_URL
  })
  const searchTeacher = sigaa.search.teacher()
  const campusList = await searchTeacher.getCampusList()
  if (process.env.CAMPUS_SEARCH) {
    const campus = campusList.find(campus => campus.name.includes(process.env.CAMPUS_SEARCH)) // search in campus
    return searchTeacher.search(searchTerm, campus)
  } else {
    return searchTeacher.search(searchTerm)
  }
}

module.exports = botAnswers
