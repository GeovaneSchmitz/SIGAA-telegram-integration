require('dotenv').config()

const getUpdate = require('./libs/get-update')
const botAnwsers = require('./libs/bot-answers')

const http = require('http')
const port = process.env.PORT ? process.env.PORT : 3000

http.createServer(async (req, res) => {
  res.write('ok')
  res.end()
}).listen(port, () => console.log('Now listening on port ' + port))

botAnwsers()
getUpdate()
setInterval(() => {
  getUpdate()
}, process.env.UPDATE_INTERVAL)
