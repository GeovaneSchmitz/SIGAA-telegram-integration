const config = require('../config')

const createTime = (date) => {
  const hours = '0' + date.getHours()
  let timeString = `${hours.substr(-2)}h`
  if (date.getMinutes() !== 0) {
    const minutes = '0' + date.getMinutes()
    timeString += `${minutes.substr(-2)}min`
  }
  return timeString
}

const wordTitleCase = word => {
  const wordsLowerCase = ['DA', 'DAS', 'DE', 'DO', 'DOS', 'E', 'EM']
  const wordsUpperCase = [
    'PI',
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
    'XI',
    'XII',
    'XIII',
    'XIV',
    'XV',
    'XVI',
    'XVII',
    'XVIII',
    'XIX',
    'XX'
  ]
  return word
    .split('-')
    .map((word, index) => {
      if (wordsLowerCase.includes(word)) {
        return word.toLowerCase()
      }
      if (wordsUpperCase.includes(word)) {
        return word
      }
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
      } else {
        return word.toLowerCase()
      }
    })
    .join('-')
}

const createNumRoman = (num) => {
  const lookup = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1
  }
  let roman = ''
  for (const i in lookup) {
    while (num >= lookup[i]) {
      roman += i
      num -= lookup[i]
    }
  }
  return roman
}

const textUtils = {}

textUtils.getPrettyClassName = (className) => {
  return config.classnames[className] || textUtils.toClassTitleCase(className)
}

textUtils.parseAbbreviation = (abbreviation) => {
  return abbreviation.replace(/[0-9]*/g, '').toUpperCase()
}

textUtils.toTitleCase = textInput => {
  const str = textInput.toUpperCase()

  return str.replace(/\w\S*/g, word => {
    const textParentheses = word.split(')')
    if (textParentheses.length === 2) {
      return wordTitleCase(textParentheses[0]) + ')'
    } else {
      return wordTitleCase(textParentheses[0])
    }
  })
}

textUtils.capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

textUtils.toClassTitleCase = textInput => {
  const text = textUtils.toTitleCase(textInput)
  return text.replace(/[0-9]*/g, number => {
    return createNumRoman(parseInt(number, 10))
  })
}

textUtils.createDateString = (date, options) => {
  const day = '0' + date.getDate()
  const month = '0' + (date.getMonth() + 1)
  const year = date.getFullYear().toString()
  const months = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro'
  ]

  const dateStringArray = []
  const optionYear = options ? (options.year === undefined ? null : options.year) : null
  const optionInWords = options ? (options.inWords === undefined ? null : options.inWords) : null
  const optionParentheses = options ? (options.parentheses === undefined ? null : options.parentheses) : null
  const optionPreposition = options ? (options.preposition === undefined ? null : options.preposition) : null

  if (optionInWords) {
    if (optionYear) {
      if (optionPreposition) dateStringArray.push('em')
      dateStringArray.push(date.getDate())
      dateStringArray.push('de')
      dateStringArray.push(months[date.getMonth()])
      dateStringArray.push('de')
      dateStringArray.push(year)
    } else {
      const dateNow = new Date()
      // 1000 * 60 * 60 * 24 = 86400000 = 1 day
      const dayDelta = Math.floor(dateNow / 86400000) - Math.floor(date.valueOf() / 86400000)
      if (dayDelta === 2) {
        dateStringArray.push('anteontem')
      } else if (dayDelta === 1) {
        dateStringArray.push('ontem')
      } else if (dayDelta === -1) {
        dateStringArray.push('amanhã')
      } else if (dayDelta === 0) {
        dateStringArray.push('hoje')
      } else {
        if (optionPreposition) dateStringArray.push('em')
        dateStringArray.push(date.getDate())
        dateStringArray.push('de')
        dateStringArray.push(months[date.getMonth()])
        if (date.getFullYear() !== dateNow.getFullYear()) {
          dateStringArray.push('de')
          dateStringArray.push(year)
        }
      }
    }
  } else {
    if (optionPreposition) dateStringArray.push('em')
    let dateStringFull = `${day.substr(-2)}/${month.substr(-2)}`
    if (optionYear || (date.getFullYear() !== new Date().getFullYear())) {
      dateStringFull += `/${year.substr(-2)}`
    }
    dateStringArray.push(dateStringFull)
  }
  const fullDateString = []
  let dateString = dateStringArray.join(' ')
  if (optionParentheses) {
    dateString = `(${dateString})`
  }
  fullDateString.push(dateString)

  if (date.getHours() !== 0 || date.getMinutes() !== 0) {
    fullDateString.push('às')
    fullDateString.push(createTime(date))
  }
  return fullDateString.join(' ')
}

textUtils.createDatesString = (startDate, endDate, options) => {
  if (startDate.valueOf() === endDate.valueOf()) {
    return textUtils.createDateString(startDate, options)
  } else {
    return `${textUtils.createDateString(startDate, options)} - ${textUtils.createDateString(endDate, options)}`
  }
}

textUtils.removeAccents = (strAccents) => {
  const accents = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž'
  const accentsOut = 'AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz'
  const textArray = strAccents.split('')
  const textAccentsOut = []
  const strAccentsLen = textArray.length
  for (let i = 0; i < strAccentsLen; i++) {
    if (accents.indexOf(textArray[i]) !== -1) {
      textAccentsOut[i] = accentsOut.substr(accents.indexOf(textArray[i]), 1)
    } else {
      textAccentsOut[i] = textArray[i]
    }
  }
  return textAccentsOut.join('')
}

const createPeriodString = (verb, startDate, endDate, options) => {
  const weekDays = [
    'no domingo',
    'na segunda-feira',
    'na terça-feira',
    'na quarta-feira',
    'na quinta-feira',
    'na sexta-feira',
    'no sábado'
  ]

  const oneDayInMilliseconds = 86400000 // 1000 * 60 * 60 * 24 = 86400000 = 1 day
  const oneWeekInMilliseconds = oneDayInMilliseconds * 7
  const startDateWithoutTime = new Date(Math.floor(startDate.valueOf() / oneDayInMilliseconds) * oneDayInMilliseconds)
  const endDateWithoutTime = new Date(Math.floor(endDate.valueOf() / oneDayInMilliseconds) * oneDayInMilliseconds)
  const hideEndDate = startDateWithoutTime.valueOf() === endDateWithoutTime.valueOf() && startDate.valueOf() > Date.now()

  const msgArray = ['Periodo', verb]
  if (startDate.valueOf() > Date.now()) {
    msgArray.push('começa')
    let parentheses = false

    const dayDelta = Math.floor(Date.now() / oneDayInMilliseconds) - Math.floor(startDate.valueOf() / oneDayInMilliseconds)

    if (dayDelta !== -1 && dayDelta !== 0 && startDateWithoutTime.valueOf() - oneWeekInMilliseconds <= Date.now()) {
      msgArray.push(weekDays[startDate.getDay()])
      parentheses = true
    }
    msgArray.push(textUtils.createDateString(startDate, {
      ...options,
      inWords: true,
      preposition: true,
      parentheses
    }))
    msgArray.push('e')
  }
  let parentheses = false

  const dayDelta = Math.floor(Date.now() / oneDayInMilliseconds) - Math.floor(endDate.valueOf() / oneDayInMilliseconds)

  if (endDate.valueOf() > Date.now()) {
    msgArray.push('termina')
    if (
      !hideEndDate &&
      dayDelta !== -1 &&
      dayDelta !== 0 &&
      endDateWithoutTime.valueOf() - oneWeekInMilliseconds <= Date.now()
    ) {
      msgArray.push(weekDays[endDate.getDay()])
      parentheses = true
    }
  } else {
    msgArray.push('terminou')
  }
  if (hideEndDate) {
    msgArray.push('às')
    msgArray.push(createTime(endDate))
  } else {
    msgArray.push(textUtils.createDateString(endDate, {
      ...options,
      parentheses,
      inWords: true,
      preposition: true
    }))
  }

  return msgArray.join(' ')
}
textUtils.createDeadLineString = (startDate, endDate, options) => {
  return createPeriodString('de envio', startDate, endDate, options)
}

textUtils.createChatPeriodString = (startDate, endDate, options) => {
  return createPeriodString('do chat', startDate, endDate, options)
}

module.exports = textUtils
