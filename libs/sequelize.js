const Sequelize = require('sequelize')

const SendLog = require('./send-log')

const env = process.env.NODE_ENV || 'development'

/**
 * database config file
 */
const dbConfig = require('../database.json')[env]
/**
 * sequelize instance
 */
const sequelize = dbConfig.use_env_variable
  ? new Sequelize(process.env[dbConfig.use_env_variable], dbConfig)
  : new Sequelize(dbConfig)

const Content = require('../models/content')
const Course = require('../models/course')
const Department = require('../models/department')
const Syllabus = require('../models/syllabus')
const Email = require('../models/email')
const File = require('../models/file')
const Grade = require('../models/grade')
const Homework = require('../models/homework')
const Link = require('../models/link')
const News = require('../models/news')
const Program = require('../models/program')
const Quiz = require('../models/quiz')
const ReferenceType = require('../models/reference-type')
const Reference = require('../models/reference')
const ScheduledChat = require('../models/scheduled-chat')
const StudentProfile = require('../models/student-profile')
const SubGrade = require('../models/sub-grade')
const TeacherProfile = require('../models/teacher-profile')
const Lesson = require('../models/lesson')
const User = require('../models/user')
const Video = require('../models/video')

/**
 * initializes all models
 */
Content.init(sequelize)
Course.init(sequelize)
Department.init(sequelize)
Syllabus.init(sequelize)
Email.init(sequelize)
File.init(sequelize)
Grade.init(sequelize)
Homework.init(sequelize)
Link.init(sequelize)
News.init(sequelize)
Program.init(sequelize)
Quiz.init(sequelize)
ReferenceType.init(sequelize)
Reference.init(sequelize)
ScheduledChat.init(sequelize)
StudentProfile.init(sequelize)
SubGrade.init(sequelize)
TeacherProfile.init(sequelize)
Lesson.init(sequelize)
User.init(sequelize)
Video.init(sequelize)

/**
 * associates all models
 */
Content.associate(sequelize.models)
Course.associate(sequelize.models)
Department.associate(sequelize.models)
Syllabus.associate(sequelize.models)
Email.associate(sequelize.models)
File.associate(sequelize.models)
Grade.associate(sequelize.models)
Homework.associate(sequelize.models)
Link.associate(sequelize.models)
News.associate(sequelize.models)
Program.associate(sequelize.models)
Quiz.associate(sequelize.models)
ReferenceType.associate(sequelize.models)
Reference.associate(sequelize.models)
ScheduledChat.associate(sequelize.models)
StudentProfile.associate(sequelize.models)
SubGrade.associate(sequelize.models)
TeacherProfile.associate(sequelize.models)
Lesson.associate(sequelize.models)
User.associate(sequelize.models)
Video.associate(sequelize.models)

sequelize
  .authenticate()
  .then(() => {
    SendLog.log('DB: Connection has been established successfully.', {
      sendToTelegram: false
    })
  })
  .catch((err) => SendLog.error(err))

module.exports = sequelize
