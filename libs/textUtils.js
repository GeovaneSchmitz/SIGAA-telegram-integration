const classNames = require('../.data/classnames')

const textUtils = {}
textUtils.getPrettyClassName = (className) => {
  return classNames[className] || className
}
textUtils.toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
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
const createTime = (date) => {
  const hours = '0' + date.getHours()
  const minutes = '0' + date.getMinutes()
  return `${hours.substr(-2)}:${minutes.substr(-2)}`
}

module.exports = textUtils
