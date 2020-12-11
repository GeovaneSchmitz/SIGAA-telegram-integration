const path = require('path')
const fs = require('fs')
const latex = require('node-latex')
const escapeLatex = require('escape-latex')
const Mustache = require('mustache')

const { Op } = require('sequelize')

const TelegramUtils = require('../libs/telegram-utils')
const TextUtils = require('../libs/text-utils')
const sequelize = require('../libs/sequelize')

/**
 * Latex template file content
 */
const latexTemplate = fs.readFileSync('./assets/syllabus-template.tex', 'utf8')

/**
 * temporary directory for saving files
 */
const tmpDestiny = require('os').tmpdir()

/**
 * app config file
 */
const config = require('../config')

/**
 * Converts html emphasis tags to latex code
 * @param {string} html
 */
const htmlTextToLatexCode = (html) => {
  let newText = html

  newText = newText.replace(/◦/g, '·') // fix item lists

  const tags = [
    {
      tagName: 'b',
      replacement: '\\textbf{'
    },
    {
      tagName: 'strong',
      replacement: '\\textbf{'
    },
    {
      tagName: 'i',
      replacement: '\\textit{'
    },
    {
      tagName: 'em',
      replacement: '\\textit{'
    }
  ]
  for (const tag of tags) {
    const openTagRegExpGlobal = RegExp(`<${tag.tagName}>`, 'g')
    const closeTagRegExpGlobal = RegExp(`</${tag.tagName}>`, 'g')

    const openTagResult = openTagRegExpGlobal.exec(newText)
    const closeTagResult = closeTagRegExpGlobal.exec(newText)

    if (
      closeTagResult !== null &&
      (openTagResult === null ||
        closeTagRegExpGlobal.lastIndex < openTagRegExpGlobal.lastIndex)
    ) {
      newText = tag.replacement + newText
    }

    openTagRegExpGlobal.lastIndex = 0
    closeTagRegExpGlobal.lastIndex = 0

    while (openTagRegExpGlobal.exec(newText) !== null) {
      newText = newText.replace(RegExp(`<${tag.tagName}>`), tag.replacement)
    }

    while (closeTagRegExpGlobal.exec(newText) !== null) {
      newText = newText.replace(RegExp(`</${tag.tagName}>`), '}')
    }

    if (
      openTagResult !== null &&
      (closeTagResult === null ||
        closeTagRegExpGlobal.lastIndex < openTagRegExpGlobal.lastIndex)
    ) {
      newText += '}'
    }
  }
  return newText
}

/**
 * Escape latex characters and convert html tag to latex code
 */
Mustache.escape = (text) => {
  let escapedText = escapeLatex(text)
  const charactersToReplace = [
    { find: '¬', replacement: '$\\neg$' },
    { find: '±', replacement: '$\\pm$' },
    { find: '×', replacement: '$\\times$' },
    { find: '÷', replacement: '$\\div$' },
    { find: '†', replacement: '$\\dagger$' },
    { find: '‡', replacement: '$\\ddagger$' },
    { find: '←', replacement: '$\\leftarrow$' },
    { find: '→', replacement: '$\\rightarrow$' },
    { find: '↔', replacement: '$\\leftrightarrow$' },
    { find: '↦', replacement: '$\\mapsto$' },
    { find: '⇌', replacement: '$\\rightleftharpoons$' },
    { find: '⇒', replacement: '$\\Rightarrow$' },
    { find: '⇔', replacement: '$\\Leftrightarrow$' },
    { find: '∀', replacement: '$\\forall$' },
    { find: '∃', replacement: '$\\exists$' },
    { find: '∄', replacement: '$\\nexists$' },
    { find: '∅', replacement: '$\\emptyset$' },
    { find: '∈', replacement: '$\\in$' },
    { find: '∉', replacement: '$\\notin$' },
    { find: '∋', replacement: '$\\ni$' },
    { find: '∓', replacement: '$\\mp$' },
    { find: '∖', replacement: '$\\setminus$' },
    { find: '∗', replacement: '$\\ast$' },
    { find: '∘', replacement: '$\\circ$' },
    { find: '∙', replacement: '$\\bullet$' },
    { find: '∝', replacement: '$\\propto$' },
    { find: '∠', replacement: '$\\angle$' },
    { find: '∡', replacement: '$\\measuredangle$' },
    { find: '∢', replacement: '$\\sphericalangle$' },
    { find: '∣', replacement: '$\\mid$' },
    { find: '∥', replacement: '$\\parallel$' },
    { find: '∦', replacement: '$\\nparallel$' },
    { find: '∧', replacement: '$\\wedge$' },
    { find: '∨', replacement: '$\\lor$' },
    { find: '∩', replacement: '$\\cap$' },
    { find: '∪', replacement: '$\\cup$' },
    { find: '∴', replacement: '$\\therefore$' },
    { find: '∵', replacement: '$\\because$' },
    { find: '∼', replacement: '$\\sim$' },
    { find: '≀', replacement: '$\\wr$' },
    { find: '≃', replacement: '$\\simeq$' },
    { find: '≅', replacement: '$\\cong$' },
    { find: '≈', replacement: '$\\approx$' },
    { find: '≍', replacement: '$\\asymp$' },
    { find: '≐', replacement: '$\\doteq$' },
    { find: '≠', replacement: '$\\neq$' },
    { find: '≡', replacement: '$\\equiv$' },
    { find: '≤', replacement: '$\\leq$' },
    { find: '≥', replacement: '$\\geq$' },
    { find: '≪', replacement: '$\\ll$' },
    { find: '≫', replacement: '$\\gg$' },
    { find: '≺', replacement: '$\\prec$' },
    { find: '≻', replacement: '$\\succ$' },
    { find: '⊂', replacement: '$\\subset$' },
    { find: '⊃', replacement: '$\\supset$' },
    { find: '⊆', replacement: '$\\subseteq$' },
    { find: '⊇', replacement: '$\\supseteq$' },
    { find: '⊈', replacement: '$\\nsubseteq$' },
    { find: '⊉', replacement: '$\\nsupseteq$' },
    { find: '⊎', replacement: '$\\uplus$' },
    { find: '⊏', replacement: '$\\sqsubset$' },
    { find: '⊐', replacement: '$\\sqsupset$' },
    { find: '⊑', replacement: '$\\sqsubseteq$' },
    { find: '⊒', replacement: '$\\sqsupseteq$' },
    { find: '⊓', replacement: '$\\sqcap$' },
    { find: '⊔', replacement: '$\\sqcup$' },
    { find: '⊕', replacement: '$\\oplus$' },
    { find: '⊖', replacement: '$\\ominus$' },
    { find: '⊗', replacement: '$\\otimes$' },
    { find: '⊘', replacement: '$\\oslash$' },
    { find: '⊙', replacement: '$\\odot$' },
    { find: '⊢', replacement: '$\\vdash$' },
    { find: '⊣', replacement: '$\\dashv$' },
    { find: '⊤', replacement: '$\\top$' },
    { find: '⊥', replacement: '$\\bot$' },
    { find: '⊨', replacement: '$\\models$' },
    { find: '⋄', replacement: '$\\diamond$' },
    { find: '⋅', replacement: '$\\cdot$' },
    { find: '⋆', replacement: '$\\star$' },
    { find: '⋈', replacement: '$\\bowtie$' },
    { find: '⌢', replacement: '$\\frown$' },
    { find: '⌣', replacement: '$\\smile$' },
    { find: '△', replacement: '$\\bigtriangleup$' },
    { find: '▹', replacement: '$\\triangleright$' },
    { find: '▽', replacement: '$\\bigtriangledown$' },
    { find: '◃', replacement: '$\\triangleleft$' },
    { find: '◯', replacement: '$\\bigcirc$' },
    { find: '⟸', replacement: '$\\impliedby$' },
    { find: '⟹', replacement: '$\\implies$' },
    { find: '⟺', replacement: '$\\iff$' },
    { find: '⨿', replacement: '$\\amalg$' },
    { find: '⪯', replacement: '$\\preceq$' },
    { find: '⪰', replacement: '$\\succeq$' },
    { find: '\u2028', replacement: '' },
    { find: '\u2029', replacement: '' }
  ]
  for (const replace of charactersToReplace) {
    escapedText = escapedText.replace(
      new RegExp(replace.find, 'g'),
      replace.replacement
    )
  }

  return htmlTextToLatexCode(escapedText)
}

/**
 * Generate course view template for mustache
 * @param {Object} syllabus
 * @param {import('../models/course')} dbCourse
 */
const generateViewTemplate = async (syllabus, dbCourse) => {
  const { TeacherProfile, User, Email, Course } = sequelize.models

  const courseTitle = TextUtils.getPrettyCourseTitle(dbCourse.title)

  const templateString = config.syllabus

  const view = {
    ...templateString,
    courseTitle,
    period: dbCourse.period,
    basicReferences: syllabus.basicReferences || [],
    supplementaryReferences: syllabus.supplementaryReferences || []
  }
  const dbTeacher = await TeacherProfile.findAll({
    include: [
      {
        model: User,
        required: true,
        include: [
          {
            model: Email,
            require: false,
            where: {
              isVerified: true
            }
          }
        ]
      },
      {
        model: Course,
        required: true,
        where: {
          id: dbCourse.id
        }
      }
    ]
  })
  view.teachers = dbTeacher.map((teacher) => {
    const email = teacher.User.Emails[0].email
    return {
      name: TextUtils.toTitleCase(teacher.User.name),
      email
    }
  })

  const paragraphs = []
  if (syllabus.methods) {
    paragraphs.push({
      title: templateString.methodsTitle,
      text: syllabus.methods
    })
  }

  if (syllabus.assessmentProcedures) {
    paragraphs.push({
      title: templateString.assessmentProceduresTitle,
      text: syllabus.assessmentProcedures
    })
  }

  if (syllabus.attendanceSchedule) {
    paragraphs.push({
      title: templateString.attendanceScheduleTitle,
      text: syllabus.attendanceSchedule
    })
  }

  view.paragraphs = formatParagraphs(paragraphs)

  view.schedule = syllabus.schedule.map((lesson) => {
    return {
      date: TextUtils.createDatesString(lesson.startDate, lesson.endDate, {
        year: true
      }),
      body: TextUtils.truncateString(lesson.body, 180)
    }
  })

  return view
}

/**
 * Generate PDF with latex
 * @param {Object} view object with fields of document
 * @param {String} filepath filepath to save the document
 * @returns {Promise}
 */
const generatePDF = (view, filepath) => {
  return new Promise((resolve, reject) => {
    const latexDoc = Mustache.render(latexTemplate, view)
    const output = fs.createWriteStream(filepath)
    const pdf = latex(latexDoc, {
      inputs: path.resolve(__dirname, '..', 'assets'),
      passes: 2
    })
    pdf.pipe(output)
    pdf.on('error', (err) => {
      err.latexDoc = latexDoc
      reject(err)
    })
    pdf.on('finish', () => resolve())
  })
}

const formatParagraphs = (paragraphs) => {
  const formattedParagraph = []
  for (const paragraph of paragraphs) {
    const texts = ['\\setstretch{1.25}']
    const lines = TextUtils.capitalizeFirstLetter(paragraph.text).split('\n')
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

/**
 * Generate Syllabus of course
 * @param {Object} syllabus
 * @param {sequelize.models.Course} dbCourse
 */
const generateSyllabus = async (syllabus, dbCourse) => {
  const view = await generateViewTemplate(syllabus, dbCourse)
  const filename = TextUtils.getFilenameWithCourseAbbreviation(
    dbCourse.abbreviation,
    config.syllabus.filename
  )
  const filepath = path.resolve(tmpDestiny, filename + '.pdf')
  await generatePDF(view, filepath)
  return await filepath
}

/**
 * Add type in reference
 * @param {sequelize.models.Reference} dbReference reference model instance
 * @param {string} type string to add as type
 */
const addReferenceTypeInReference = async (dbReference, type) => {
  const { ReferenceType } = sequelize.models
  if (type) {
    const dbHasType =
      dbReference.ReferenceTypes &&
      dbReference.ReferenceTypes.some(
        (referenceType) => referenceType.name === type
      )
    if (!dbHasType) {
      const [dbReferenceType] = await ReferenceType.findOrCreate({
        where: {
          name: type
        },
        defaults: {
          name: type
        }
      })
      await dbReference.addReferenceType(dbReferenceType)
    }
  }
}

/**
 * Update references
 * @param {object} syllabus the syllabus with reference
 * @param {sequelize.model.Course} dbCourse
 * @returns {Promise<boolean>} if there was an update
 */
const updateReferences = async (syllabus, dbCourse) => {
  const { Reference, ReferenceType } = sequelize.models
  let haveUpdate = false
  const references = [
    ...syllabus.basicReferences.map((reference) => {
      return {
        ...reference,
        category: 'basic'
      }
    }),
    ...syllabus.supplementaryReferences.map((reference) => {
      return {
        ...reference,
        category: 'supplementary'
      }
    })
  ]
  const usedReferenceId = []
  for (const reference of references) {
    let [dbReference] = await Reference.findOrCreate({
      where: {
        courseId: dbCourse.id,
        body: reference.description
      },
      include: [
        {
          model: ReferenceType
        }
      ]
    })

    if (!dbReference) {
      haveUpdate = true
      dbReference = await Reference.create({
        courseId: dbCourse.id,
        body: reference.description
      })
    }
    usedReferenceId.push(dbReference.id)
    await addReferenceTypeInReference(dbReference, reference.category)
    await addReferenceTypeInReference(dbReference, reference.type)
  }
  const deletedRefernceCount = await Reference.count({
    where: {
      courseId: dbCourse.id,
      id: { [Op.notIn]: usedReferenceId }
    }
  })
  if (deletedRefernceCount > 0) {
    haveUpdate = true
    await Reference.destroy({
      where: {
        courseId: dbCourse.id,
        id: { [Op.notIn]: usedReferenceId }
      }
    })
  }
  return haveUpdate
}

/**
 * check if syllabus has updated
 * @param {object} syllabus the syllabus
 * @param {sequelize.model.Course} dbCourse
 * @returns {Promise<boolean>} if there was an update
 */
const checkIfHasUpdated = async (syllabus, dbCourse) => {
  const { Lesson, Reference, ReferenceType, Syllabus } = sequelize.models

  if (
    syllabus.methods === null &&
    syllabus.assessmentProcedures === null &&
    syllabus.attendanceSchedule === null
  ) {
    return false
  }

  const dbSyllabus = await Syllabus.findOne({
    where: {
      courseId: dbCourse.id
    },
    order: [['createdAt', 'DESC']]
  })

  if (!dbSyllabus) {
    return true
  }

  if (syllabus.methods && syllabus.methods !== dbCourse.methods) {
    return true
  }

  if (
    syllabus.assessmentProcedures &&
    syllabus.assessmentProcedures !== dbCourse.assessmentProcedures
  ) {
    return true
  }

  if (
    syllabus.attendanceSchedule &&
    syllabus.attendanceSchedule !== dbCourse.attendanceSchedule
  ) {
    return true
  }

  const lessonCount = await Lesson.count({
    where: {
      courseId: dbCourse.id,
      updatedAt: {
        [Op.gte]: dbSyllabus.createdAt
      }
    }
  })

  if (lessonCount > 0) {
    return true
  }

  const basicReferenceCount = await Reference.count({
    where: {
      courseId: dbCourse.id
    },
    include: {
      model: ReferenceType,
      required: true,
      where: {
        name: 'basic'
      }
    }
  })

  /**
   * Remove duplicate values
   */
  const uniqueBasicReferencesCount = new Set(
    syllabus.basicReferences.map((reference) => reference.description)
  ).size

  if (basicReferenceCount !== uniqueBasicReferencesCount) {
    return true
  }

  const basicReferences = syllabus.basicReferences.map(
    (reference) => reference.description
  )

  const basicReferenceBodyCount = await Reference.count({
    where: {
      courseId: dbCourse.id,
      body: basicReferences
    },
    include: {
      model: ReferenceType,
      required: true,
      where: {
        name: 'basic'
      }
    }
  })

  if (basicReferenceBodyCount !== uniqueBasicReferencesCount) {
    return true
  }

  const supplementaryReferenceCount = await Reference.count({
    where: {
      courseId: dbCourse.id
    },
    include: {
      model: ReferenceType,
      required: true,
      where: {
        name: 'supplementary'
      }
    }
  })

  /**
   * Remove duplicate values
   */
  const uniqueSupplementaryReferencesCount = new Set(
    syllabus.supplementaryReferences.map((reference) => reference.description)
  ).size

  if (supplementaryReferenceCount !== uniqueSupplementaryReferencesCount) {
    return true
  }

  const supplementaryReferences = syllabus.supplementaryReferences.map(
    (reference) => reference.description
  )

  const supplementaryReferenceBodyCount = await Reference.count({
    where: {
      courseId: dbCourse.id,
      body: supplementaryReferences
    },
    include: {
      model: ReferenceType,
      required: true,
      where: {
        name: 'supplementary'
      }
    }
  })

  if (supplementaryReferenceBodyCount !== uniqueSupplementaryReferencesCount) {
    return true
  }

  return false
}

/**
 * Update methods, assessmentProcedures, attendanceSchedule of syllabus
 * @param {object} syllabus the syllabus
 * @param {import('../models/course')} dbCourse
 * @returns {Promise<boolean>} if there was an update
 */
const updateSyllabusBody = async (syllabus, dbCourse) => {
  let shouldUpdate = false

  if (syllabus.methods && syllabus.methods !== dbCourse.methods) {
    dbCourse.set('methods', syllabus.methods)
    shouldUpdate = true
  }

  if (
    syllabus.assessmentProcedures &&
    syllabus.assessmentProcedures !== dbCourse.assessmentProcedures
  ) {
    dbCourse.set('assessmentProcedures', syllabus.assessmentProcedures)
    shouldUpdate = true
  }

  if (
    syllabus.attendanceSchedule &&
    syllabus.attendanceSchedule !== dbCourse.attendanceSchedule
  ) {
    dbCourse.set('attendanceSchedule', syllabus.attendanceSchedule)
    shouldUpdate = true
  }

  if (shouldUpdate) {
    await dbCourse.save()
    return true
  }

  return false
}

/**
 * @description updater course education plan in database and send files to telegram
 * @param {import('../models/course')} dbCourse
 * @param {import('sigaa-api').SigaaCourseStudent} course
 */
const syllabusUpdater = async (dbCourse, course) => {
  const { Syllabus } = sequelize.models
  const syllabus = await course.getSyllabus()

  const shouldSyllabusBeUpdated = await checkIfHasUpdated(syllabus, dbCourse)

  if (shouldSyllabusBeUpdated) {
    const filepath = await generateSyllabus(syllabus, dbCourse)
    const telegramFileId = await TelegramUtils.sendNotificationDocument({
      source: filepath
    })
    if (telegramFileId) {
      await updateSyllabusBody(syllabus, dbCourse)
      await updateReferences(syllabus, dbCourse)
      await Syllabus.create({
        courseId: dbCourse.id,
        telegramId: telegramFileId
      })
    }
  }
}

module.exports = syllabusUpdater
