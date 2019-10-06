const textUtils = require('./textUtils')
const config = require('../config')

async function classGrades (classStudent, storage, telegram) {
  const data = storage.getData('grades')
  const grades = await classStudent.getGrades()
  if (!data[classStudent.id]) {
    data[classStudent.id] = {}
  }
  if (!data[classStudent.id].className) {
    data[classStudent.id].className = classStudent.title
  }
  if (!data[classStudent.id].grades) {
    data[classStudent.id].grades = []
  }
  const storedGrades = data[classStudent.id].grades
  let addedGradesStack = []
  let gradesStack = ''
  const deletedGradesStack = []
  const usedGrades = []
  for (const gradeGroup of grades) {
    if (gradeGroup.grades === undefined) {
      let found = false
      for (const storedGrade of storedGrades) {
        if (storedGrade.grades === undefined && storedGrade.name === gradeGroup.name) {
          if (storedGrade.value !== null) {
            if (storedGrade.value !== gradeGroup.value) {
              gradesStack += `Valor de ${gradeGroup.name} alterado\n`
            }
            found = true
          }
          usedGrades.push(storedGrades.indexOf(storedGrade))
          break
        }
      }
      if (!found && gradeGroup.value !== null) {
        addedGradesStack.push(gradeGroup.name)
      }
    } else {
      const foundGroup = storedGrades.find(storedGradeGroup => {
        if (storedGradeGroup.grades !== undefined && storedGradeGroup.name === gradeGroup.name) {
          usedGrades.push(storedGrades.indexOf(storedGradeGroup))
          if (storedGradeGroup.average !== gradeGroup.average) {
            gradesStack += `Media do Grupo ${gradeGroup.name} alterado\n`
          }
          for (const grade of gradeGroup.grades) {
            const foundGrade = storedGradeGroup.grades.find(storedGrade => {
              if (storedGrade.value === null) {
                return false
              }
              if (JSON.stringify(storedGrade) === JSON.stringify(grade)) {
                return true
              } else if (storedGrade.name === grade.name &&
                          storedGrade.weight !== grade.weight &&
                          storedGrade.value === grade.value) {
                gradesStack += `Peso da ${storedGrade.name} alterado de ${storedGrade.weight} -> ${grade.weight}\n`
                return true
              } else if (storedGrade.name === grade.name &&
                storedGrade.weight === grade.weight &&
                storedGrade.value !== grade.value) {
                gradesStack += `Valor da ${storedGrade.name} alterado\n`
                return true
              } else if (storedGrade.name === grade.name) {
                let gradeStack = `${grade.name}, `
                let gradeNumberOfModifications = 0
                if (storedGrade.weight !== grade.weight) {
                  gradeStack += `Peso de ${storedGrade.weight} -> ${grade.weight} e `
                  gradeNumberOfModifications++
                }
                if (storedGrade.value !== grade.value) {
                  gradeStack += `Valor e `
                  gradeNumberOfModifications++
                }
                if (gradeNumberOfModifications === 1) {
                  gradeStack = gradeStack.slice(0, -2)
                  gradeStack += `alterado\n`
                  gradesStack += gradeStack
                } else if (gradeNumberOfModifications > 1) {
                  gradeStack = gradeStack.slice(0, -2)
                  gradeStack += `alterados\n`
                  gradesStack += gradeStack
                }
                return true
              }
              return false
            })
            if (!foundGrade && grade.value !== null) {
              addedGradesStack.push(`${grade.name} com peso ${grade.weight}`)
            }
          }
          return true
        } else {
          return false
        }
      })
      if (!foundGroup) {
        const gradeGroupStack = []
        for (const grade of gradeGroup.grades) {
          if (grade.value !== null) {
            gradeGroupStack.push(`${grade.name} com peso ${grade.weight}`)
          }
        }
        if (gradeGroupStack.length !== 0) {
          addedGradesStack.push(`Grupo ${gradeGroup.name}`)
          addedGradesStack = addedGradesStack.concat(gradeGroupStack)
        }
      }
    }
  }
  if (gradesStack !== '') gradesStack = 'Notas Alteradas\n' + gradesStack
  if (addedGradesStack.length > 1) {
    let addedMsg = ''
    for (const grade of addedGradesStack) {
      addedMsg += grade + '\n'
    }
    gradesStack = `Notas Adicionadas\n${addedMsg}\n${gradesStack}`
  } else if (addedGradesStack.length === 1) {
    gradesStack = `Nota ${addedGradesStack[0]} adicionada\n${gradesStack}`
  }

  const deletedGrades = storedGrades.filter((grade, index) => {
    return usedGrades.indexOf(index) === -1
  })

  for (const gradeGroup of deletedGrades) {
    if (gradeGroup.grades) {
      deletedGradesStack.push(gradeGroup.name)
      for (const grade of gradeGroup.grades) {
        if (grade.value !== null) {
          deletedGradesStack.push(`${grade.name} com peso ${grade.weight}`)
        }
      }
    } else if (gradeGroup.value !== null) {
      deletedGradesStack.push(gradeGroup.name)
    }
  }
  if (deletedGradesStack.length > 1) {
    let deletedMsg = ''
    for (const grade of deletedGradesStack) {
      deletedMsg += grade + '\n'
    }
    gradesStack = `Notas Removidas\n${deletedMsg}\n${gradesStack}`
  } else if (deletedGradesStack.length === 1) {
    gradesStack = `${deletedGradesStack[0]} removida\n${gradesStack}`
  }
  if (gradesStack !== '') {
    const msg = `${textUtils.getPrettyClassName(classStudent.title)}\n${gradesStack}`
    for (const chatID of config.notifications.chatIDs) {
      await telegram.sendMessage(chatID, msg)
    }
    data[classStudent.id] = {}
    data[classStudent.id].grades = grades
    data[classStudent.id].className = classStudent.title
    storage.saveData('grades', data)
  }
}

module.exports = classGrades
