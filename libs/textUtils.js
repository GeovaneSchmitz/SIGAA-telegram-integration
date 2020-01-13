const config = require('../config')

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

function createNumRoman (num) {
  var lookup = {
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
  var roman = ''
  var i
  for (i in lookup) {
    while (num >= lookup[i]) {
      roman += i
      num -= lookup[i]
    }
  }
  return roman
}
textUtils.toClassTitleCase = textInput => {
  const text = textUtils.toTitleCase(textInput)
  return text.replace(/[0-9]*/g, number => {
    return createNumRoman(parseInt(number, 10))
  })
}
textUtils.createDateString = (date) => {
  const day = '0' + date.getDate()
  const month = '0' + (date.getMonth() + 1)
  const year = date.getFullYear().toString()
  let dateString
  if (date.getFullYear() === new Date().getFullYear()) {
    dateString = `${day.substr(-2)}/${month.substr(-2)}`
  } else {
    dateString = `${day.substr(-2)}/${month.substr(-2)}/${year.substr(-2)}`
  }
  if (date.getHours() !== 0 || date.getMinutes() !== 0) {
    dateString += ` às ${createTime(date)}`
  }
  return dateString
}

textUtils.createDatesString = (startDate, endDate) => {
  if (startDate.valueOf() === endDate.valueOf()) {
    return textUtils.createDateString(startDate)
  } else {
    return `${textUtils.createDateString(startDate)} - ${textUtils.createDateString(endDate)}`
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
const createTime = (date) => {
  const hours = '0' + date.getHours()
  const minutes = '0' + date.getMinutes()
  return `${hours.substr(-2)}:${minutes.substr(-2)}`
}

module.exports = textUtils
