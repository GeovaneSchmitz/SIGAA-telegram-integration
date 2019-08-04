const classNames = require('../classnames')

const textUtils = {}
textUtils.getPrettyClassName = (className) => {
  return classNames[className] || className
}
const createDate = (timestamp) => {
  const date = new Date(timestamp * 1000)
  const day = '0' + date.getDate()
  const month = '0' + (date.getMonth() + 1)
  const year = date.getFullYear().toString()
  if (date.getFullYear() === new Date().getFullYear()) {
    return `${day.substr(-2)}/${month.substr(-2)}`
  } else {
    return `${day.substr(-2)}/${month.substr(-2)}/${year.substr(-2)}`
  }
}

textUtils.createDatesFromTimestamps = (startTimestamp, endTimestamp) => {
  if (startTimestamp === endTimestamp) {
    return createDate(startTimestamp)
  } else {
    return `${createDate(startTimestamp)} - ${createDate(endTimestamp)}`
  }
}
const createTime = (timestamp) => {
  const date = new Date(timestamp * 1000)
  const hours = '0' + date.getHours()
  const minutes = '0' + date.getMinutes()
  return `${hours.substr(-2)}:${minutes.substr(-2)}`
}
textUtils.createFullDateFromTimestamp = (timestamp) => {
  return `${createDate(timestamp)} ${createTime(timestamp)}`
}

module.exports = textUtils
