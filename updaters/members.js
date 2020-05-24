const sequelize = require('../libs/sequelize')
const SendLog = require('../libs/send-log')

/**
 * app config file
 */
const config = require('../config')

/**
 * @description updater course members
 * @param {import('../models/course')} dbCourse
 * @param {import('sigaa-api').SigaaCourseStudent} course
 */
const updaterMembers = async (dbCourse, course) => {
  const {
    Course,
    User,
    TeacherProfile,
    StudentProfile,
    File,
    Program,
    Department,
    Email
  } = sequelize.models

  const [dbTeachers, dbStudents, { students, teachers }] = await Promise.all([
    TeacherProfile.findAll({
      attributes: {
        include: ['User.username']
      },
      include: [
        {
          model: User,
          required: true
        },
        {
          model: Course,
          required: true,
          where: {
            id: dbCourse.id
          }
        }
      ]
    }),
    StudentProfile.findAll({
      attributes: {
        include: ['User.username']
      },
      include: [
        {
          model: User,
          required: true
        },
        {
          model: Course,
          required: true,
          where: {
            id: dbCourse.id
          }
        }
      ]
    }),
    course.getMembers()
  ])

  const dbTeachersUsernameIn = dbTeachers.map(
    (teacher) => teacher.User.username
  )
  const dbStudentsUsername = dbStudents.map((student) => student.User.username)

  const teachersUsername = teachers.map((teacher) => teacher.username)
  const studentsUsername = students.map((student) => student.username)

  const newTeachers = teachers.filter(
    (teacher) => !dbTeachersUsernameIn.includes(teacher.username)
  )

  const newStudents = students.filter(
    (student) => !dbStudentsUsername.includes(student.username)
  )

  const users = [...teachers, ...students]

  const dbNewUsers = await User.bulkCreate(users, {
    fields: ['name', 'username'],
    updateOnDuplicate: ['name']
  })

  const usersWithPhoto = [...teachers, ...students]
    .filter((user) => user.photoURL)
    .map((user) => {
      const url = new URL(user.photoURL)
      return {
        ...user,
        institutionalId: url.searchParams.get('idFoto'),
        institutionalKey: url.searchParams.get('key')
      }
    })

  const dbPhotos = await File.bulkCreate(usersWithPhoto, {
    fields: ['institutionalId', 'institutionalKey'],
    updateOnDuplicate: ['institutionalKey']
  })

  const usersWithPhotoId = usersWithPhoto.map((user) => {
    const photo = dbPhotos.find(
      (photo) => photo.institutionalId === user.institutionalId
    )
    return {
      ...user,
      photoId: photo.id
    }
  })

  await User.bulkCreate(usersWithPhotoId, {
    fields: ['name', 'username', 'photoId'],
    updateOnDuplicate: ['name', 'photoId']
  })

  const newDepartment = Array.from(
    new Set(
      newTeachers
        .filter((teacher) => teacher.department)
        .map((teacher) => teacher.department)
    )
  ).map((name) => {
    return { name }
  })

  const dbDepartment = await Department.bulkCreate(newDepartment, {
    fields: ['name'],
    updateOnDuplicate: ['name']
  })

  const newPrograms = Array.from(
    new Set(
      newStudents
        .filter((student) => student.program)
        .map((student) => student.program)
    )
  ).map((name) => {
    return { name }
  })

  const dbPrograms = await Program.bulkCreate(newPrograms, {
    fields: ['name'],
    updateOnDuplicate: ['name']
  })

  const TeacherProfileDbFiles = await TeacherProfile.bulkCreate(
    newTeachers.map((teacher) => {
      const user = dbNewUsers.find((user) => user.username === teacher.username)
      const department = dbDepartment.find(
        (department) => department.name === teacher.department
      )
      return {
        userId: user.id,
        departmentId: department.id,
        formation: teacher.formation
      }
    }),
    {
      fields: ['userId', 'departmentId', 'formation'],
      updateOnDuplicate: ['departmentId', 'formation']
    }
  )

  const StudentProfileDbFiles = await StudentProfile.bulkCreate(
    newStudents.map((student) => {
      const user = dbNewUsers.find((user) => user.username === student.username)
      const program = dbPrograms.find(
        (program) => program.name === student.program
      )
      return {
        userId: user.id,
        programId: program ? program.id : null,
        registrationCode: student.registration
      }
    }),
    {
      fields: ['userId', 'programId', 'registrationCode'],
      updateOnDuplicate: ['programId', 'registrationCode']
    }
  )

  await dbCourse.addTeacher(TeacherProfileDbFiles)
  await dbCourse.addStudent(StudentProfileDbFiles)

  const deletedTeachers = dbTeachers.filter(
    (teacher) => !teachersUsername.includes(teacher.User.username)
  )

  const deletedStudents = dbStudents.filter(
    (student) => !studentsUsername.includes(student.User.username)
  )

  for (const user of students) {
    try {
      const dbUser = await User.findOne({
        where: {
          username: user.username
        },
        include: [
          {
            model: Email
          }
        ]
      })

      if (!dbUser) {
        throw new Error('NOT_FOUND_USER_IN_DB')
      }

      if (user.email) {
        const email = user.email.toLowerCase()
        const dbUserEmailIs = dbUser.Emails.some(
          (dbEmail) => dbEmail.email === email
        )
        if (!dbUserEmailIs) {
          await dbUser.createEmail({ email, isVerified: true })
        }
      }
      const institutionalEmail = `${user.username}@${config.ifsc.studentDefaultEmailDomain}`.toLowerCase()
      const dbInstitutionalEmail = dbUser.Emails.some(
        (dbEmail) => dbEmail.email === institutionalEmail
      )

      if (
        institutionalEmail !== user.email.toLowerCase() &&
        !dbInstitutionalEmail
      ) {
        await dbUser.createEmail({
          email: institutionalEmail,
          isVerified: false
        })
      }
    } catch (err) {
      await SendLog.error(err)
    }
  }

  for (const user of teachers) {
    try {
      const dbUser = await User.findOne({
        where: {
          username: user.username
        },
        include: [
          {
            model: Email
          }
        ]
      })

      if (!dbUser) {
        throw new Error('NOT_FOUND_USER_IN_DB')
      }

      if (user.email) {
        const email = user.email.toLowerCase()

        const dbUserEmailIs = dbUser.Emails.some(
          (dbEmail) => dbEmail.email === email
        )
        if (!dbUserEmailIs) {
          await dbUser.createEmail({ email, isVerified: true })
        }
      }
      const institutionalEmail = `${user.username}@${config.ifsc.teacherDefaultEmailDomain}`.toLowerCase()
      const dbInstitutionalEmail = dbUser.Emails.some(
        (dbEmail) => dbEmail.email === institutionalEmail
      )

      if (
        institutionalEmail !== user.email.toLowerCase() &&
        !dbInstitutionalEmail
      ) {
        await dbUser.createEmail({
          email: institutionalEmail,
          isVerified: false
        })
      }
    } catch (err) {
      await SendLog.error(err)
    }
  }

  await dbCourse.removeTeacher(deletedTeachers)
  await dbCourse.removeStudent(deletedStudents)
}

module.exports = updaterMembers
