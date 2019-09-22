const Telegraf = require('telegraf')
const Sigaa = require('sigaa-api')
const textUtils = require('./textUtils')

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
    const searchTerm = message.text.slice(message.text.indexOf(' ') + 1)
    const results = await searchTeacher(searchTerm)
    let response = ''
    for (let i = 0; i < results.length; i++) {
      if (i > 5) break
      const name = textUtils.toTitleCase(results[i].name)
      const department = textUtils.toTitleCase(results[i].department)
      const email = await results[i].getEmail()
      response += `${name}\n`
      response += `${department}\n`
      response += `${email}\n\n`
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
    const searchTerm = message.text.slice(message.text.indexOf(' ') + 1)
    const results = await searchTeacher(searchTerm)
    let response = ''
    for (let i = 0; i < results.length; i++) {
      if (i > 5) break
      const name = textUtils.toTitleCase(results[i].name)
      const department = textUtils.toTitleCase(results[i].department)
      const email = await results[i].getEmail()
      const calendar = `https://zimbra.ifsc.edu.br/service/home/${email}/atividadesIFSC.html?view=week\n\n`

      response += `${name}\n`
      response += `${department}\n`
      response += `${calendar}\n`
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
    const campus = campusList.find(campus => campus.name.includes(process.env.CAMPUS_SEARCH)) // search in campus FLN
    return searchTeacher.search(searchTerm, campus)
  } else {
    return searchTeacher.search(searchTerm)
  }
}

module.exports = botAnswers
