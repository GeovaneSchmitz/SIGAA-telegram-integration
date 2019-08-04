const http = require('http')
const grades = require('./libs/grades')
const news = require('./libs/news')
const topics = require('./libs/topics')
const storage = require('./libs/storage')

const getUpdate = async () => {
  await topics(storage)
  await news(storage)
  await grades(storage)
}
const port = process.env.PORT ? process.env.PORT : 3000

let request = false
http.createServer(async (req, res) => {
  res.statusCode = 200
  res.write('ok')
  res.end()
  if (!request) {
    request = true
    await getUpdate()
    // eslint-disable-next-line require-atomic-updates
    request = false
  }
}).listen(port, () => console.log('Now listening on port ' + port))
