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
    chatIDs: [], // array with chatId will that be notify, chatId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdate 'message.chat.id'
    updateInterval: 1800000 // in miliseconds. 1800000 is 30min
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
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdate 'message.from.id'
      denyMsg: '', // message sent if user not in allowlist, if string is empty nothing is sent
      startMsg: '/agenda <termo de busca> - Lista as agendas dos Professores correspondente\n' +
      '/email <termo de busca> - Lista os email dos Professores correspondentes\n' +
      'É exibido somente os 5 primeiros resultados' // message sent after / start
    },

    calendarSearch: {
      command: 'agenda', // command that must be entered without the slash with search term. e.g. /agenda bob
      enable: true, // if command is enabled
      allowlistEnable: false, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdate 'message.from.id'
      denyMsg: '', // message sent if user not in allowlist, if string is empty nothing is sent
      maxResultAmount: 5, // limit result amount
      calendarUnavailableMsg: 'Agenda indisponível', // message sent if calendar is unavailable
      noResultsMsg: 'Sem resultado' // message sent if no search results
    },
    emailSearch: {
      command: 'email', // command that must be entered without the slash with search term. e.g. /email bob
      enable: true, // if command is enabled
      allowlistEnable: false, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdate 'message.from.id'
      denyMsg: '', // message sent if user not in allowlist, if string is empty nothing is sent
      maxResultAmount: 5, // limit result amount
      emailUnavailableMsg: 'E-Mail indisponível', // message sent if E-Mail is unavailable
      noResultsMsg: 'Sem resultado' // message sent if no search results
    },

    forceUpdade: {
      command: 'atualizar', // command that must be entered without the slash. e.g. /atualizar
      enable: false, // if command is enabled
      allowlistEnable: false, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdate 'message.from.id'
      denyMsg: 'Este comando é restrito', // message sent if user not in allowlist, if string is empty nothing is sent
      startMsg: 'Buscando por novos conteúdos', // message sent as feedback after type the command
      isInProgressMsg: 'Já está em progresso', // message sent if bot was already updating
      endMsg: 'Finalizado' // message sent after finishing updating
    },

    viewGrades: {
      command: 'vernotas', // command that must be entered without the slash. e.g. /vernotas matematica
      enable: false, // if command is enabled
      allowlistEnable: false, // false for all users or true for user in allowlist
      allowlist: [], // array with userId allowed, userId can be obtained in https://api.telegram.org/bot<BOT_TOKEN>/getUpdate 'message.from.id'
      denyMsg: 'Este comando é restrito', // message sent if user not in allowlist, if string is empty nothing is sent
      noResultsMsg: 'Sem resultado' // message sent if no search results
    }
  }
}
