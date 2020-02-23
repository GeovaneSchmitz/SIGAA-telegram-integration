const lescape = require('escape-latex')
const Mustache = require('mustache')
const textUtils = require('./textUtils')
const latex = require('node-latex')
const fs = require('fs')
const path = require('path')
const config = require('../config')

const storage = require('./storage')
const templateString = require('../assets/templateString')
const latexTemplate = fs.readFileSync('./assets/educationalPlanTemplate.tex', 'utf8')

const BaseDestiny = path.join(__dirname, '..', 'pdfs_education_plans')

fs.mkdir(BaseDestiny, (err) => {
  if (err && err.code !== 'EEXIST') throw new Error('up')
})

Mustache.escape = function (text) {
  let newText = lescape(text)
  const replaces = [
    {
      pattern: /<b>|<strong>/g, // match <b> and <strong>
      replacement: '\\textbf{'
    },
    {
      pattern: /<i>|<em>/g, // replace middle dot with \n and middle dot
      replacement: '\\textit{'
    },
    {
      pattern: /<\/em>|<\/i>|<\/strong>|<\/b>/g, // tags to replace with \n
      replacement: '}'
    },
    {
      pattern: /◦/g, // tags to replace with \n
      replacement: '·'
    }
  ]

  for (const replace of replaces) {
    newText = newText.replace(replace.pattern, replace.replacement)
  }
  return newText
}

const genPDF = (view, filepath) => {
  return new Promise((resolve, reject) => {
    const latexDoc = Mustache.render(latexTemplate, view)
    const output = fs.createWriteStream(filepath)
    const pdf = latex(latexDoc, {
      inputs: path.resolve(__dirname, '..', 'assets'),
      passes: 2
    })
    pdf.pipe(output)
    pdf.on('error', err => {
      reject(err)
    })
    pdf.on('finish', () => resolve())
  })
}

const formatParagraph = (paragraphs) => {
  const formattedParagraph = []
  for (const paragraph of paragraphs) {
    const texts = ['\\setstretch{1.25}']
    const lines = textUtils.capitalizeFirstLetter(paragraph.text).split('\n')
    let isList = false
    for (const line of lines) {
      if (line.charAt(0) === '·' || line.charAt(0) === '-') {
        if (!isList) {
          texts.push('\\setlength{\\parskip}{0em}')
          texts.push('\\begin{itemize}')
          isList = true
        }
        texts.push(`\\item ${Mustache.escape(line.slice(1))}`)
      } else if (isList) {
        texts.push('\\end{itemize}')
        texts.push('')
        texts.push('\\setlength{\\parskip}{1em}')
        texts.push(Mustache.escape(line))
        isList = false
      } else {
        texts.push('\\par ' + Mustache.escape(line))
      }
    }
    if (isList) {
      texts.push('\\end{itemize}')
      texts.push('\\setlength{\\parskip}{1em}')
    }

    formattedParagraph.push({
      title: paragraph.title,
      text: texts.join('\n')
    })
  }

  return formattedParagraph
}
const genTemplateView = (plan, classStudent, members) => {
  const classname = textUtils.getPrettyClassName(classStudent.title)
  const view = {
    ...templateString,
    classname,
    period: classStudent.period,
    basicReferences: plan.basicReferences || false,
    supplementaryReferences: plan.supplementaryReferences || false
  }

  if (plan.basicReferences && plan.basicReferences.length > 0) {
    view.hasBasicReferences = true
  } else {
    view.hasBasicReferences = false
  }
  if (plan.supplementaryReferences && plan.supplementaryReferences.length > 0) {
    view.hasSupplementaryReferences = true
  } else {
    view.hasSupplementaryReferences = false
  }
  view.teachers = members.teachers.map(teacher => {
    return {
      name: textUtils.toClassTitleCase(teacher.name),
      email: teacher.email.toLowerCase()
    }
  })

  if (plan.attendanceSchedule) {
    view.attendanceSchedule = plan.attendanceSchedule
  } else {
    view.attendanceSchedule = false
  }
  const paragraphs = []
  if (plan.methodology) {
    paragraphs.push({
      title: templateString.methodologyTitle,
      text: plan.methodology
    })
  }
  if (paragraphs.length === 0 && !plan.schedule) throw new Error('NO_INFORMATION_FOR_TEACHING_PLAN')
  if (plan.assessmentProcedures) {
    paragraphs.push({
      title: templateString.assessmentProceduresTitle,
      text: plan.assessmentProcedures
    })
  }
  view.paragraphs = formatParagraph(paragraphs)
  if (plan.schedule && plan.schedule.length > 0) {
    view.hasSchedule = true
    view.schedule = plan.schedule.map((scheduleDay, index) => {
      const startDate = new Date(scheduleDay.startDate)
      const endDate = new Date(scheduleDay.endDate)
      return {
        date: textUtils.createDatesString(startDate, endDate, { year: true }),
        body: scheduleDay.body
      }
    })
  } else {
    view.hasSchedule = false
  }
  return view
}
const genEducationPlan = async (classStudent) => {
  const data = storage.getData('plans')
  const plan = await classStudent.getEducationPlan()
  try {
    if (!data[classStudent.id]) data[classStudent.id] = {}

    if (JSON.stringify(plan) !== JSON.stringify(data[classStudent.id].plan)) {
      const classname = textUtils.getPrettyClassName(classStudent.title)
      const members = await classStudent.getMembers()
      const view = genTemplateView(plan, classStudent, members)
      const filename = `${classname} ${classStudent.period} - Plano de ensino.pdf`
      const filepath = path.join(BaseDestiny, filename)
      await genPDF(view, filepath)
      data[classStudent.id].filename = filename
      data[classStudent.id].plan = plan
      storage.saveData('plans', data)
      return true
    }
  } catch (err) {
    if (err.message === 'NO_INFORMATION_FOR_TEACHING_PLAN') {
      data[classStudent.id].plan = plan
      storage.saveData('plans', data)
      return false
    } else {
      throw err
    }
  }
  return false
}

const sendDocument = async (classId, chatIds, telegram) => {
  const data = storage.getData('plans')
  if (data[classId] && data[classId].filename) {
    const filepath = path.join(BaseDestiny, data[classId].filename)
    let telegramFile
    for (const chatID of chatIds) {
      if (telegramFile) {
        await telegram.sendDocument(chatID, telegramFile.document['file_id'])
      } else {
        telegramFile = await telegram.sendDocument(chatID, {
          source: filepath
        })
      }
    }
  }
}
const educationalPlanNotify = async (classStudent, telegram) => {
  const wasUpdated = await genEducationPlan(classStudent)
  if (wasUpdated) {
    sendDocument(classStudent.id, config.notifications.chatIDs, telegram)
  }
}
module.exports = { genEducationPlan, sendDocument, educationalPlanNotify }
