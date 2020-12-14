/**
 * app config file
 */
const config = require('../config')
/**
 * @description Static methods to create and convert strings
 * @class TextUtils
 */
class TextUtils {
  /**
   * @description Returns class name in config file or title case format
   * @param {String} courseTitle class name
   * @returns {string}
   */
  static getPrettyCourseTitle(courseTitle) {
    return (
      config.courseTitles[courseTitle] ||
      TextUtils.courseTitleToTitleCase(courseTitle)
    )
  }

  /**
   * create time string from Date
   * @param {Date} date
   * @returns {string} return time in format HH:MM
   */
  static _createTimeString(date) {
    const hours = '0' + date.getHours()
    const minutes = '0' + date.getMinutes()
    const timeString = `${hours.substr(-2)}:${minutes.substr(-2)}`
    return timeString
  }

  /**
   * convert number to roman format
   * @param {number} number
   * @returns {string} number in romam format
   */
  static _convertToRomanFormat(number) {
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
      while (number >= lookup[i]) {
        roman += i
        number -= lookup[i]
      }
    }
    return roman
  }

  /**
   * @description returns class abbreviation from course code
   * @param {string} code
   * @param {string}
   */
  static getAbbreviationFromCode(code) {
    return code.replace(/[0-9]*/g, '').toUpperCase()
  }

  /**
   * Convert word in uppercase to title case
   * @param {string} word
   * @return {string} word in title case
   */
  static _wordTitleCase(word) {
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

  /**
   * @description Convert uppercase to title case
   * @param {String} textInput
   * @returns {string}
   */
  static toTitleCase(textInput) {
    const str = textInput.toUpperCase()

    return str.replace(/\w\S*/g, (word) => {
      const textParentheses = word.split(')')
      if (textParentheses.length === 2) {
        return TextUtils._wordTitleCase(textParentheses[0]) + ')'
      } else {
        return TextUtils._wordTitleCase(textParentheses[0])
      }
    })
  }

  /**
   * @description Capitalize only first letter
   * @param {string} string
   * @returns {string}
   */
  static capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  /**
   * @description Convert from uppercase to title case and change number to roman format
   * @param {string} courseTitle
   */
  static courseTitleToTitleCase(courseTitle) {
    const text = TextUtils.toTitleCase(courseTitle)
    return text.replace(/[0-9]*/g, (number) => {
      return TextUtils._convertToRomanFormat(parseInt(number, 10))
    })
  }

  /**
   * @description Escape markdownV2 text
   * @param {string}
   * @returns {string}
   */
  static escapeMarkdownV2(string) {
    return string.replace(/[\\_*[\]()~`><#+\-=|{}.!]/gm, '\\$&')
  }

  /**
   * @description Truncate a string and concat with ...
   * @param {string} string string to truncate
   * @param {number} size maximum string length
   * @returns {string}
   */
  static truncateString(string, size) {
    if (string.length <= size) {
      return string
    }
    return string.slice(0, size) + '...'
  }

  /**
   * @description create date string in format 'DD/MM/YY' or 'DD/MM' (Brazilian format)
   * @param {Date} date date to create string
   * @param {Object} options
   * @param {boolean} [options.year] if show year (default is to show the year if the date of the year is not current)
   * @returns {string}
   */
  static createDateString(date, options) {
    const day = '0' + date.getDate()
    const month = '0' + (date.getMonth() + 1)
    const year = date.getFullYear().toString()

    const dateStringArray = []
    const optionYear = options
      ? options.year === undefined
        ? null
        : options.year
      : null

    let dateStringFull = `${day.substr(-2)}/${month.substr(-2)}`
    if (optionYear || date.getFullYear() !== new Date().getFullYear()) {
      dateStringFull += `/${year.substr(-2)}`
    }
    dateStringArray.push(dateStringFull)

    return dateStringArray.join(' ')
  }

  /**
   * @description create date time string in format 'DD/MM/YY às HH:MM' or 'DD/MM às HH:MM' (Brazilian format)
   * @param {Date} date date to create string
   * @param {Object} options
   * @param {boolean} [options.year] if show year (default is to show the year if the date of the year is not current)
   * @returns {string}
   */
  static createDateTimeString(date, options) {
    const fullDateString = []
    fullDateString.push(TextUtils.createDateString(date, options))
    fullDateString.push('às')
    fullDateString.push(TextUtils._createTimeString(date))

    return fullDateString.join(' ')
  }

  /**
   * @description create date period string in format 'DD/MM/YY - DD/MM/YY' or 'DD/MM - DD/MM' (Brazilian format)
   * if the start date and end date are the same, only the start date is displayed in string
   * @param {Date} startDate start date
   * @param {Date} endDate end date
   * @param {Object} options
   * @param {boolean} [options.year] if show year (default is to show the year if the date of the year is not current)
   * @returns {string}
   */
  static createDatesString(startDate, endDate, options) {
    if (startDate.valueOf() === endDate.valueOf()) {
      return TextUtils.createDateString(startDate, options)
    } else {
      return `${TextUtils.createDateString(
        startDate,
        options
      )} - ${TextUtils.createDateString(endDate, options)}`
    }
  }

  /**
   * @description create date period string (Brazilian format)
   * @param {Date} startDate start date
   * @param {Date} endDate end date
   * @param {Object} options
   * @param {boolean} [options.year] if show year (default is to show the year if the date of the year is not current)
   * @returns {string}
   */
  static createPeriodString(startDate, endDate, options) {
    const msgArray = []
    if (startDate.valueOf() > Date.now()) {
      msgArray.push('começa')
      msgArray.push('em')
      msgArray.push(TextUtils.createDateTimeString(startDate, options))
      msgArray.push('e')
    }

    if (endDate.valueOf() > Date.now()) {
      msgArray.push('termina')
    } else {
      msgArray.push('terminou')
    }

    msgArray.push('em')
    msgArray.push(TextUtils.createDateTimeString(endDate, options))

    return msgArray.join(' ')
  }

  /**
   * creates file name with the course code
   * @param {string} abbreviation course abbreviation
   * @param {string} filename
   * @returns {string}
   */
  static getFilenameWithCourseAbbreviation(abbreviation, filename) {
    return `${abbreviation} - ${filename}`
  }
}

module.exports = TextUtils
