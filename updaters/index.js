const Sigaa = require('sigaa-api')

const TextUtils = require('../libs/text-utils')
const SendLog = require('../libs/send-log')

const gradesUpdater = require('./grades')
const courseUpdater = require('./course')
const newsUpdater = require('./news')
const lessonsUpdater = require('./lessons')
const filesUpdater = require('./files')
const membersUpdater = require('./members')
const syllabusUpdater = require('./syllabus')

/**
 * app config file
 */
const config = require('../config')

/**
 * track member update interval
 */
let membersIntevalCount = 0

/**
 * Create string from time difference
 * @param {string} label time difference label
 * @param {Data} startTime
 * @param {Date} endTime
 */
const calcTime = (label, startTime, endTime) => {
  const deltaTime = Math.trunc((endTime.valueOf() - startTime.valueOf()) / 1000)
  let deltaText
  if (deltaTime >= 60) {
    deltaText = `${Math.trunc(deltaTime / 60)}min e ${deltaTime % 60}s `
  } else {
    deltaText = deltaTime + 's'
  }
  return `> ${label}: ${deltaText}`
}

/**
 * Run the function and log the execution time or if there was an error
 * @param {string} label task label
 * @param {Function} task function that returns a promise
 * @param {object} sendLogOptions options for SendLog
 * @param {any} arg task arguments
 * @return {Promise<any>} task result
 * @async
 */
const runTask = async (label, task, sendLogOptions, ...arg) => {
  try {
    const taskStartTime = Date.now()
    const result = await task(...arg)
    SendLog.log(calcTime(label, taskStartTime, Date.now()), sendLogOptions)
    return result
  } catch (err) {
    SendLog.log(`> ${label}: Error`, sendLogOptions)
    SendLog.log(err)
  }
}

/**
 * Update database and notify
 * @param {Object} logOptions log the execution
 * @param {boolean} logOptions.sendToTelegram if the execution log must be sent to the telegram, the default is false
 * @param {String} logOptions.chatId chat id to send the execution log
 */
const updater = async (logOptions) => {
  if (membersIntevalCount > config.search.intervalToFetchCourseMembers) {
    membersIntevalCount = 0
  }

  membersIntevalCount++

  try {
    const sigaa = new Sigaa({
      url: config.sigaa.url
    })
    const account = await sigaa.login(
      process.env.SIGAA_USERNAME,
      process.env.SIGAA_PASSWORD
    ) // login
    const courses = await account.getCourses() // this return a array with all courses
    for (const course of courses) {
      // for each course
      try {
        const courseTitle = TextUtils.getPrettyCourseTitle(course.title)

        SendLog.log(courseTitle, logOptions)

        const dbCourse = await runTask(
          'course Record',
          courseUpdater,
          logOptions,
          course
        )

        if (membersIntevalCount === 1) {
          await runTask('members', membersUpdater, logOptions, dbCourse, course)
        }

        const tasks = {
          lessons: lessonsUpdater,
          grades: gradesUpdater,
          news: newsUpdater,
          files: filesUpdater
        }

        const promises = Object.keys(tasks).map(async (task) => {
          if (config.notifications[task]) {
            await runTask(task, tasks[task], logOptions, dbCourse, course)
          }
        })

        await Promise.all(promises)

        if (config.notifications.syllabus) {
          await runTask(
            'syllabus',
            syllabusUpdater,
            logOptions,
            dbCourse,
            course
          )
        }
      } catch (err) {
        await SendLog.error(err)
      }
    }
  } catch (err) {
    await SendLog.error(err)
  }
}

module.exports = updater
