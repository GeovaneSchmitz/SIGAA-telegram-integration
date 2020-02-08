const path = require('path')
const Telegram = require('telegraf/telegram')
const Telegraf = require('telegraf')
const Sigaa = require('sigaa-api')
const textUtils = require('./textUtils')
const storage = require('./storage')
const config = require('../config')
const getUpdate = require('./getUpdate')
const https = require('https')
const sendLog = require('./sendLog')
const bot = new Telegraf(process.env.BOT_TOKEN)
const importDataChats = []

const startCommand = () => {
  const startConfig = config.commands.start
  accessControlAllowlist(startConfig)
  bot.command(startConfig.command, (ctx) => {
    if (startConfig.startMsg) {
      ctx.reply(startConfig.startMsg)
    }
  })
}

const importDataCommand = () => {
  const importConfig = config.commands.importData
  accessControlAllowlist(importConfig)
  bot.on('message', async (ctx, next) => {
    const chat = ctx.chat
    const chatIndex = importDataChats.findIndex(chatId => {
      return chatId === chat.id
    })
    if (chatIndex > -1) {
      try {
        importDataChats.splice(chatIndex, 1)
        if (!ctx.message.document) {
          console.log(ctx.message.text)
          if (ctx.message.text === '/' + importConfig.commandCancel) {
            if (importConfig.invalidMsg) {
              await ctx.reply(importConfig.cancelMsg)
            } else {
              throw Error('IMPORT_DATA_CANCEL_MSG_NOT_FOUND')
            }
          } else {
            if (importConfig.invalidMsg) {
              await ctx.reply(importConfig.invalidMsg)
            } else {
              throw Error('IMPORT_DATA_INVALID_MSG_NOT_FOUND')
            }
          }
        } else {
          const telegram = new Telegram(process.env.BOT_TOKEN)
          const link = await telegram.getFileLink(ctx.message.document['file_id'])
          const fileBuffer = await httpGetRequest(link)
          try {
            const data = JSON.parse(fileBuffer)
            await storage.updateData(data)
            if (importConfig.invalidFileMsg) {
              await ctx.reply(importConfig.successfulMsg)
            } else {
              throw Error('IMPORT_DATA_INVALID_SUCCESSFUL_MSG_NOT_FOUND')
            }
            process.exit()
          } catch (err) {
            importDataChats.push(ctx.chat.id)
            if (importConfig.invalidFileMsg) {
              await ctx.reply(importConfig.invalidFileMsg)
            } else {
              throw Error('IMPORT_DATA_INVALID_FILE_MSG_NOT_FOUND')
            }
          }
        }
      } catch (err) {
        sendLog.error(err)
      }
    }
    next()
  })
  bot.command(importConfig.command, (ctx) => {
    try {
      const chat = ctx.chat
      if (chat.type === 'private') {
        importDataChats.push(
          chat.id
        )
        if (importConfig.fileMsg) {
          ctx.reply(importConfig.fileMsg)
        }
      } else {
        ctx.reply(importConfig.groupDenyMsg)
      }
    } catch (err) {
      sendLog.error(err)
    }
  })
}
const exportDataCommand = () => {
  const exportCommandConfig = config.commands.exportData
  accessControlAllowlist(exportCommandConfig)
  bot.command(exportCommandConfig.command, async (ctx) => {
    try {
      if (ctx.chat.type === 'private') {
        await ctx.replyWithDocument({
          source: path.join(__dirname, '../.data/data.json')
        })
      } else {
        if (exportCommandConfig.groupDenyMsg) {
          await ctx.reply(exportCommandConfig.groupDenyMsg)
        } else {
          throw Error('EXPORT_DATA_GROUP_DENY_MSG_NOT_FOUND')
        }
      }
    } catch (err) {
      sendLog.error(err)
    }
  })
}
const calendarSearchCommand = () => {
  const calendarSearchConfig = config.commands.calendarSearch
  accessControlAllowlist(calendarSearchConfig)
  bot.command(calendarSearchConfig.command, async (ctx) => {
    const message = ctx.message
    const searchTerm = textUtils.removeAccents(message.text.slice(message.text.indexOf(' ') + 1).toLowerCase())
    let response = ''
    ctx.replyWithChatAction('typing')
    const results = await getTeacher(searchTerm, calendarSearchConfig.maxResultAmount)
    for (const result of results) {
      let calendar
      if (result.email !== null) {
        calendar = `https://zimbra.ifsc.edu.br/service/home/${result.email}/atividadesIFSC.html?view=week`
      } else {
        calendar = calendarSearchConfig.calendarUnavailableMsg
      }
      if (result.className) {
        response += `${result.className}\n`
      }
      response += `${result.name}\n`
      response += `${result.department}\n`
      response += `${calendar}\n\n`
    }
    if (response !== '') {
      ctx.reply(response.slice(0, -2))
    } else {
      if (calendarSearchConfig.noResultsMsg) {
        ctx.reply(calendarSearchConfig.noResultsMsg)
      }
    }
  })
}

const emailSearchCommand = () => {
  const emailSearchConfig = config.commands.emailSearch
  accessControlAllowlist(emailSearchConfig)
  bot.command(emailSearchConfig.command, async (ctx) => {
    const message = ctx.message
    const searchTerm = textUtils.removeAccents(message.text.slice(message.text.indexOf(' ') + 1).toLowerCase())
    let response = ''
    ctx.replyWithChatAction('typing')
    const results = await getTeacher(searchTerm, emailSearchConfig.maxResultAmount)
    for (const result of results) {
      let email
      if (result.email !== null) {
        email = result.email
      } else {
        email = emailSearchConfig.emailUnavailableMsg
      }
      if (result.className) {
        response += `${result.className}\n`
      }
      response += `${result.name}\n`
      response += `${result.department}\n`
      response += `${email}\n\n`
    }
    if (response !== '') {
      ctx.reply(response.slice(0, -2))
    } else {
      if (emailSearchConfig.noResultsMsg) {
        ctx.reply(emailSearchConfig.noResultsMsg)
      }
    }
  })
}

const forceUpdateCommand = () => {
  const forceUpdateConfig = config.commands.forceUpdate
  accessControlAllowlist(forceUpdateConfig)
  bot.command(forceUpdateConfig.command, async (ctx) => {
    if (forceUpdateConfig.startMsg) {
      ctx.reply(forceUpdateConfig.startMsg)
    }
    getUpdate({
      sendLogToTelegram: true
    }).finally(() => {
      if (forceUpdateConfig.endMsg) {
        ctx.reply(forceUpdateConfig.endMsg)
      }
    })
  })
}

const viewGradesCommand = () => {
  const viewGradesConfig = config.commands.viewGrades
  accessControlAllowlist(viewGradesConfig)
  bot.command(viewGradesConfig.command, (ctx) => {
    const message = ctx.message
    const searchTermIndex = message.text.indexOf(' ') + 1
    let searchTerm
    if (searchTermIndex !== 0) {
      searchTerm = textUtils.removeAccents(message.text.slice(searchTermIndex).toLowerCase())
    } else {
      searchTerm = ''
    }
    const grades = storage.getData('grades')
    let keys = Object.keys(grades)
    if (searchTerm) {
      keys = keys.filter(key => {
        const className = textUtils.removeAccents(grades[key].className.toLowerCase())
        const classNamePretty = textUtils.removeAccents(textUtils.getPrettyClassName(grades[key].className).toLowerCase())
        return className.indexOf(searchTerm) > -1 || classNamePretty.indexOf(searchTerm) > -1
      })
    }
    let msg = ''
    for (const key of keys) {
      const classGrades = grades[key].grades
      const className = grades[key].className
      if (classGrades) {
        let classGradesMsg = ''
        for (const gradeGroup of classGrades) {
          if (gradeGroup.grades === undefined) {
            if (gradeGroup.value != null) {
              classGradesMsg += `${textUtils.toTitleCase(gradeGroup.name)} com ${gradeGroup.value}\n`
            }
          } else {
            classGradesMsg += `Grupo ${textUtils.toTitleCase(gradeGroup.name)}\n`
            for (const grade of gradeGroup.grades) {
              if (grade.value !== null) {
                classGradesMsg += `${grade.name} com peso ${grade.weight} e valor ${grade.value}\n`
              }
            }
            if (gradeGroup.average !== null) {
              classGradesMsg += `Média ${gradeGroup.average}\n`
            }
          }
        }
        if (classGradesMsg) {
          msg += `${textUtils.getPrettyClassName(className)}\n${classGradesMsg}\n`
        }
      }
    }
    if (msg !== '') {
      ctx.reply(msg.slice(0, -2))
    } else {
      if (viewGradesConfig.noResultsMsg) {
        ctx.reply(viewGradesConfig.noResultsMsg)
      }
    }
  })
}

const accessControlAllowlist = (config) => {
  if (config.allowlistEnable) {
    bot.command(config.command, (ctx, next) => {
      if (config.allowlist.indexOf(ctx.message.from.id) > -1) {
        next()
      } else {
        if (config.denyMsg) {
          ctx.reply(config.denyMsg)
          const msg = `Command /${config.command} denied access for user ${ctx.message.from.username}, add ${ctx.message.from.id} to allow the user`
          sendLog.info(msg)
        }
      }
    })
  }
}

const getTeacher = async (searchTerm, limitResult = 5) => {
  const results = searchTeacherByClassName(searchTerm)
  const teacherNameResults = await searchTeacherByName(searchTerm)
  for (let i = results.length; i < limitResult && i < teacherNameResults.length; i++) {
    const name = teacherNameResults[i].name
    const department = teacherNameResults[i].department
    const email = await teacherNameResults[i].getEmail()
    results.push({
      className: null,
      name: textUtils.toTitleCase(name),
      department: textUtils.toTitleCase(department),
      email
    })
  }
  return results
}

const searchTeacherByClassName = (searchTerm) => {
  const results = []
  const teacherMembersClasses = storage.getData('members')
  for (const teacherMembers of teacherMembersClasses) {
    const className = textUtils.removeAccents(teacherMembers.className.toLowerCase())
    const classNamePretty = textUtils.removeAccents(textUtils.getPrettyClassName(teacherMembers.className).toLowerCase())
    if (className.indexOf(searchTerm) > -1 || classNamePretty.indexOf(searchTerm) > -1) {
      for (const teacher of teacherMembers.teachers) {
        const className = textUtils.toTitleCase(teacherMembers.className)
        const name = textUtils.toTitleCase(teacher.name)
        const department = textUtils.toTitleCase(teacher.department)
        const email = teacher.email
        results.push({
          className,
          name,
          department,
          email
        })
      }
    }
  }
  return results
}
const searchTeacherByName = async (searchTerm) => {
  const sigaa = new Sigaa({
    url: config.sigaa.url
  })
  const searchTeacher = sigaa.search.teacher()
  const campusList = await searchTeacher.getCampusList()
  if (config.search.campusFilter) {
    const campus = campusList.find(campus => campus.name.includes(config.search.campusFilter)) // search in campus
    return searchTeacher.search(searchTerm, campus)
  } else {
    return searchTeacher.search(searchTerm)
  }
}

if (config.commands.exportData.enable) {
  exportDataCommand()
}

if (config.commands.importData.enable) {
  importDataCommand()
}

if (config.commands.start.enable) {
  startCommand()
}
if (config.commands.emailSearch.enable) {
  emailSearchCommand()
}
if (config.commands.calendarSearch.enable) {
  calendarSearchCommand()
}
if (config.commands.forceUpdate.enable) {
  forceUpdateCommand()
}
if (config.commands.viewGrades.enable) {
  viewGradesCommand()
}

bot.launch()
function httpGetRequest (link) {
  const url = new URL(link)
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Telegram bot'
    }
  }
  return new Promise((resolve, reject) => {
    const req = https.request(options, (response) => {
      switch (response.statusCode) {
        case 200:
          try {
            const chunks = []
            response.on('data', (chunk) => {
              chunks.push(Buffer.from(chunk, 'binary'))
            })
            response.on('error', (err) => {
              reject(err)
            })
            response.on('end', () => {
              resolve(Buffer.concat(chunks))
            })
          } catch (err) {
            reject(err)
          }
          break
        default:
          reject(new Error(`INVALID_STATUSCODE_${response.statusCode}`))
      }
    })
    req.end()
  })
}
