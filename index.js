require('dotenv').config()
require('./libs/getUpdate')
require('./libs/commands')

const http = require('http')
const port = process.env.PORT ? process.env.PORT : 3000

http.createServer(async (req, res) => {
  res.write('ok')
  res.end()
}).listen(port, () => console.log('Now listening on port ' + port))
