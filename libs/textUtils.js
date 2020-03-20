const config = require('../config')

const createTime = (date) => {
  const hours = '0' + date.getHours()
  const minutes = '0' + date.getMinutes()
  return `${hours.substr(-2)}:${minutes.substr(-2)}`
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
  let dateString = ''
  const optionYear = options ? (options.year === undefined ? null : options.year) : null
  const optionParentheses = options ? (options.parentheses === undefined ? null : options.parentheses) : null
  if (optionParentheses) {
    dateString += '('
  }
  dateString += `${day.substr(-2)}/${month.substr(-2)}`
  if (optionYear || (optionYear === null && date.getFullYear() !== new Date().getFullYear())) {
    dateString += `/${year.substr(-2)}`
  }
  if (optionParentheses) {
    dateString += ')'
  }
  if (date.getHours() !== 0 || date.getMinutes() !== 0) {
    dateString += ` às ${createTime(date)}`
  }
  return dateString
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

textUtils.createDeadLineString = (startDate, endDate, options) => {
  const msgArray = ['Periodo de envio']
  if (startDate.valueOf() > Date.now()) {
    msgArray.push('começará em')
    msgArray.push(textUtils.createDateString(startDate, options))
    msgArray.push('e')
  }
  let parentheses = false
  if (endDate.valueOf() > Date.now()) {
    const endDateTime = (((((endDate.getHours() * 60) + endDate.getMinutes()) * 60) + endDate.getSeconds()) * 1000) + endDate.getMilliseconds()
    const endDateWithoutTime = new Date(endDate.valueOf() - endDateTime)
    const oneWeekInMilliseconds = 604800000
    if (endDateWithoutTime.valueOf() - oneWeekInMilliseconds <= Date.now()) {
      msgArray.push('terminará')
      const weekDays = [
        'no domingo',
        'na segunda-feira',
        'na terça-feira',
        'na quarta-feira',
        'na quinta-feira',
        'na sexta-feira',
        'no sábado'
      ]
      msgArray.push(weekDays[endDate.getDay()])
      parentheses = true
    } else {
      msgArray.push('terminará em')
    }
  } else {
    msgArray.push('terminou em')
  }
  msgArray.push(textUtils.createDateString(endDate, {
    ...options,
    parentheses
  }))

  return msgArray.join(' ')
}
module.exports = textUtils
