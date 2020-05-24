module.exports = {
  sigaa: {
    url: 'https://sigaa.ifsc.edu.br' // SIGAA url
  },

  ifsc: {
    teacherDefaultEmailDomain: 'ifsc.edu.br',
    studentDefaultEmailDomain: 'aluno.ifsc.edu.br'
  },

  syllabus: {
    disclaimer:
      'Este documento foi gerado automaticamente a partir de software de terceiros, ' +
      'utilizando de informações contidas em sistemas e documentos do IFSC. O conteú' +
      'do deste documento pode ter erros, imprecisões e falta de informações. Não te' +
      'm a aprovação do IFSC e nem do docente, portanto este documento não tem garan' +
      'tia de qualquer natureza, inclusive legal. Este documento é de uso interno e ' +
      'pode conter direito autorais em seu conteúdo, a distribuição para público ext' +
      'erno deve ser autorizado pelo docente e a instituição.',
    documentTitle: 'Plano de ensino',
    methodsTitle: 'Metodologia',
    assessmentProceduresTitle: 'Procedimentos de Avaliação da Aprendizagem',
    attendanceScheduleTitle: 'Horário de atendimento',
    scheduleTitle: 'Cronograma de Aulas',
    scheduleTitleContinuing: 'Cronograma de Aulas - Continuação',
    scheduleDateColumn: 'Data',
    scheduleDescriptionColumn: 'Descrição',
    basicReferencesTitle: 'Referências Básicas',
    supplementaryReferencesTitle: 'Referências Complementares',
    filename: 'Plano de ensino'
  },

  courseTitles: {
    // rename your courses to what you like, e.g.
    // 'PORTUGUÊS E HISTÓRIA DA LITERATURA BRASILEIRA': 'Português'
  },

  notifications: {
    chatIds: [], // array with chatId will that be notify, chatId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.chat.id'
    updateInterval: 1800000, // in miliseconds. 1800000 is 30min
    grades: true, // Grades update, if false /vernotas doesn't work properly
    lessons: true, // lessons and all attachments
    files: true,
    news: true,
    syllabus: true // Necessary to have latex installed
  },

  logs: {
    chatIds: [] // array with chatId will that be notify, chatId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.chat.id'
  },

  search: {
    maxResultAmount: 5, // limit result amount
    campusFilter: 'FLN', // String to filter the campus
    // in notification.updateInteval,
    // e.g if notification.updateInteval = 180000 and intervalToFetchCourseMembers = 10 inteval will equal 180000 * 10 ms
    intervalToFetchCourseMembers: 24
  },

  commands: {
    start: {
      command: 'start', // command that must be entered without the slash. e.g /start
      enable: true, // if command is enabled
      allowlistEnable: false, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.from.id'
      denyMsg: '', // message sent if user not in allowlist, if string is empty nothing is sent
      startMsg:
        '/agenda <termo de busca> - Lista as agendas dos Professores correspondente\n' +
        '/email <termo de busca> - Lista os email dos Professores correspondentes\n' +
        '/atendimento\n' +
        '/plano\n' +
        'É exibido somente os 5 primeiros resultados' // message sent after / start
    },

    calendarSearch: {
      command: 'agenda', // command that must be entered without the slash with search term. e.g. /agenda bob
      enable: true, // if command is enabled
      allowlistEnable: false, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.from.id'
      denyMsg: '', // message sent if user not in allowlist, if string is empty nothing is sent
      calendarUnavailableMsg: 'Agenda indisponível', // message sent if calendar is unavailable
      courseListMsg:
        'Digite /agenda <termo de busca> para pesquisar, ou se preferir escolha uma turma abaixo para listar a agenda dos professores',
      tooManyResultsMsg:
        'Enviado apenas os primeiros resultados, refine seu termo de pesquisa se necessário', // message sent if the result was limited by the amount
      noResultsMsg: 'Sem resultado', // message sent if no search results
      attendanceScheduleTip:
        'Se você estiver procurando pelo atendimento, talvez /atendimento pode ser útil', // message sent at the end
      calendarLink: ({ email }) =>
        `https://zimbra.ifsc.edu.br/service/home/${email}/atividadesIFSC.html?view=week`
    },

    emailSearch: {
      command: 'email', // command that must be entered without the slash with search term. e.g. /email bob
      enable: true, // if command is enabled
      allowlistEnable: false, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.from.id'
      denyMsg: '', // message sent if user not in allowlist, if string is empty nothing is sent
      emailUnavailableMsg: 'E-Mail indisponível', // message sent if E-Mail is unavailable
      courseListMsg:
        'Digite /email <termo de busca> para pesquisar, ou se preferir escolha uma turma abaixo para listar os emails dos professores',
      possibleEmails: '',
      tooManyResultsMsg:
        'Enviado apenas os primeiros resultados, refine seu termo de pesquisa se necessário', // message sent if the result was limited by the amount
      noResultsMsg: 'Sem resultado' // message sent if no search results
    },

    forceUpdate: {
      command: 'atualizar', // command that must be entered without the slash. e.g. /atualizar
      enable: false, // if command is enabled
      allowlistEnable: false, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.from.id'
      denyMsg: 'Este comando é restrito', // message sent if user not in allowlist, if string is empty nothing is sent
      startMsg: 'Buscando por novos conteúdos', // message sent as feedback after type the command
      endMsg: 'Finalizado' // message sent after finishing updating
    },

    viewGrades: {
      command: 'vernotas', // command that must be entered without the slash. e.g. /vernotas matematica
      enable: true, // if command is enabled
      allowlistEnable: true, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.from.id'
      denyMsg: 'Este comando é restrito a chats específicos', // message sent if user not in allowlist, if string is empty nothing is sent
      noResultsMsg: 'Sem resultado', // message sent if no search results
      noGradesMsg: 'Sem notas' // message sent if no grades
    },

    syllabus: {
      command: 'plano', // command that must be entered without the slash. e.g. /plano
      enable: false, // if command is enabled
      allowlistEnable: true, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.chat.id'
      courseListMsg: 'Para continuar, escolha uma turma',
      denyMsg: 'Este comando é restrito a chats específicos' // message sent if user not in allowlist, if string is empty nothing is sent
    },

    attendanceSchedule: {
      command: 'atendimento', // command that must be entered without the slash. e.g. /atualizar
      enable: false, // if command is enabled
      allowlistEnable: true, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.chat.id'
      denyMsg: 'Este comando é restrito a chats específicos', // message sent if user not in allowlist, if string is empty nothing is sent
      noResultsMsg: 'Sem atendimento cadastrado', // message sent if no search results
      courseListMsg:
        'Para continuar, escolha uma turma, se não encontrar a turma desejada procure pela agenda do docente usando /agenda',
      moreThanOneTeacherInCourseObservation:
        'Talvez este atendimento, é só para um dos professores' // message sent if there is more than one teacher in the course
    }
  }
}
