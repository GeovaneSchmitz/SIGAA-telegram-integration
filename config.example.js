/* eslint-disable quote-props */
module.exports = {
  sigaa: {
    url: 'https://sigaa.ifsc.edu.br' // SIGAA url
  },

  classnames: {
    // rename your classes to what you like, e.g.
    // 'PORTUGUÊS E HISTÓRIA DA LITERATURA BRASILEIRA': 'Português'
  },

  notifications: {
    chatIDs: [], // array with chatId will that be notify, chatId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.chat.id'
    updateInterval: 1800000, // in miliseconds. 1800000 is 30min
    grades: true, // Grades update, if false /vernotas doesn't work properly
    topics: true, // Topics and attachments, such as: research, questionnaire, videos and homework
    files: true,
    news: true,
    educationalPlan: true // Necessary to have latex installed
  },

  logs: {
    chatIDs: [] // array with chatId will that be notify, chatId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.chat.id'
  },

  search: {
    campusFilter: '', // String to filter the campus
    intervalToFetchClassMembers: 43200000 // in miliseconds. 43200000 is 12h
  },

  commands: {
    start: {
      command: 'start', // command that must be entered without the slash. e.g /start
      enable: true, // if command is enabled
      allowlistEnable: false, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.from.id'
      denyMsg: '', // message sent if user not in allowlist, if string is empty nothing is sent
      startMsg: '/agenda <termo de busca> - Lista as agendas dos Professores correspondente\n' +
      '/email <termo de busca> - Lista os email dos Professores correspondentes\n' +
      '/atendimento <termo de busca> - Mostra os atendimento dos Professores correspondentes\n' +
      '/plano <termo de busca> - Retorna plano de ensino das unidade curricular correspondentes\n' +
      'É exibido somente os 5 primeiros resultados' // message sent after / start
    },

    calendarSearch: {
      command: 'agenda', // command that must be entered without the slash with search term. e.g. /agenda bob
      enable: true, // if command is enabled
      allowlistEnable: false, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.from.id'
      denyMsg: '', // message sent if user not in allowlist, if string is empty nothing is sent
      maxResultAmount: 5, // limit result amount
      calendarUnavailableMsg: 'Agenda indisponível', // message sent if calendar is unavailable
      tooManyResultsMsg: 'Enviado apenas os primeiros resultados, refine seu termo de pesquisa se necessário', // message sent if the result was limited by the amount
      noResultsMsg: 'Sem resultado', // message sent if no search results
      attendanceScheduleTip: 'Se você estiver procurando pelo atendimento, talvez /atendimento pode ser útil' // message sent at the end
    },

    emailSearch: {
      command: 'email', // command that must be entered without the slash with search term. e.g. /email bob
      enable: true, // if command is enabled
      allowlistEnable: false, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.from.id'
      denyMsg: '', // message sent if user not in allowlist, if string is empty nothing is sent
      maxResultAmount: 5, // limit result amount
      emailUnavailableMsg: 'E-Mail indisponível', // message sent if E-Mail is unavailable
      tooManyResultsMsg: 'Enviado apenas os primeiros resultados, refine seu termo de pesquisa se necessário', // message sent if the result was limited by the amount
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
      noResultsMsg: 'Sem resultado' // message sent if no search results
    },

    importData: {
      command: 'importData', // command that must be entered without the slash. e.g. /importData
      commandCancel: 'cancel', // command for cancel that must be entered without the slash. e.g. /cancel
      enable: false, // if command is enabled
      allowlistEnable: true, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.from.id'
      denyMsg: 'Este comando é restrito', // message sent if user not in allowlist, if string is empty nothing is sent
      fileMsg: 'Envie um arquivo json com histórico ou /cancel para cancelar a operação', // message sent after importData command
      invalidMsg: 'Messagem invalida, importData cancelado', // message sent if is a text msg
      groupDenyMsg: 'Por segurança, este comando só pode ser executado em chat privado', // message denying if received from a group
      invalidFileMsg: 'Arquivo invalido', // message sent if is a invalid file
      successfulMsg: 'Arquivo data atualizado com sucesso', // message sent if the operation is successful
      cancelMsg: 'Operação cancelada' // message sent if the operation is canceled
    },

    exportData: {
      command: 'exportData', // command that must be entered without the slash. e.g. /exportData
      enable: false, // if command is enabled
      allowlistEnable: true, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.from.id'
      groupDenyMsg: 'Por segurança, este comando só pode ser executado em chat privado', // message denying if received from a group
      denyMsg: 'Este comando é restrito a chats específicos' // message sent if user not in allowlist, if string is empty nothing is sent
    },

    educationalPlan: {
      command: 'plano', // command that must be entered without the slash. e.g. /plano
      enable: false, // if command is enabled
      allowlistEnable: true, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.chat.id'
      maxResultAmount: 5, // limit result amount
      tooManyResultsMsg: 'Enviado apenas os primeiros resultados, refine seu termo de pesquisa se necessário', // message sent if the result was limited by the amount
      denyMsg: 'Este comando é restrito a chats específicos', // message sent if user not in allowlist, if string is empty nothing is sent
      noResultsMsg: 'Sem resultado, a unidade curricular ou professor não tem um plano de ensino cadastrado' // message sent if no search results
    },

    attendanceSchedule: {
      command: 'atendimento', // command that must be entered without the slash. e.g. /atualizar
      enable: false, // if command is enabled
      allowlistEnable: true, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 'message.chat.id'
      denyMsg: 'Este comando é restrito a chats específicos', // message sent if user not in allowlist, if string is empty nothing is sent
      maxResultAmount: 5, // limit result amount
      tooManyResultsMsg: 'Enviado apenas os primeiros resultados, refine seu termo de pesquisa se necessário', // message sent if the result was limited by the amount
      noResultsMsg: 'Sem resultado, a unidade curricular ou professor não tem um atendimento cadastrado. Você pode conseguir encontrar na agenda usando /agenda', // message sent if no search results
      moreThanOneTeacherInClassObservation: 'Talvez este atendimento, é só para um dos professores' // message sent if there is more than one teacher in the class
    }
  }
}
