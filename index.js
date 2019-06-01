const Sigaa = require("sigaa-api")
const http = require("http")
const path = require('path');
const Telegram = require('telegraf/telegram')
const fs = require("fs")

const classNames = require('./classnames')
const sigaa = new Sigaa({
  "urlBase": "https://sigaa.ifsc.edu.br",
});



let credentials;
try {
  credentials = require("./credentials")
  if (credentials.username == "" || credentials.password == "" || credentials.token == "" || credentials.chatId == "") {
    throw "invalid credentials"
  }
} catch{
  console.log("fill in the credentials.json")
  credentials = {
    "username": "",
    "password": "",
    "token": "",
    "chatId": "",
  }
  fs.writeFile("./credentials.json", JSON.stringify(credentials), function (err) {
    if (err) throw err;
    process.exit()

  });
}
const telegram = new Telegram(credentials.token)


let saveData = () => {
  fs.writeFile(storeDataFilename, JSON.stringify(data), function (err) {
    if (err) throw err;
  }
  );
}

let removeYear = (date) => {
  return date.slice(0, date.lastIndexOf("/"))
}
let getPrettyClassName = (className) => {
  return classNames[className] ? classNames[className] : className
}
let getUpdate = async () => {
  let account = await sigaa.login(credentials.username, credentials.password) // login
  let classes = await account.getClasses(); // this return a array with all classes
  console.log("Topics")
  await classTopics(classes)
  console.log("News")
  await classNews(classes)
  console.log("grades")
  await classGrades(classes)
  await account.logoff() // logoff afeter finished 
  process.exit()
}

let storeDataFilename = __dirname + "/data.json";
let data;
try {
  data = require(storeDataFilename)
} catch{
  data = {
    "topics": {},
    "grades": {},
    "news": {}
  }
  saveData()
}

let port = process.env.PORT ? process.env.PORT : 3000;

let request = false;
http.createServer(async (req, res) => {
  res.statusCode = 200; res.write("ok");
  res.end();
  if (!request) {
    request = true
    await getUpdate()
    .catch(console.log);
    request = false
  }
}).listen(port, () => console.log("Now listening on port " + port));



let BaseDestiny = path.join(__dirname, "downloads")


async function classGrades(classes) {
  for (let classStudent of classes) { //for each class
    try {
      console.log(getPrettyClassName(classStudent.name))
      var grades = await classStudent.getGrades()
      if (!data.grades[classStudent.name]) data.grades[classStudent.name] = []

      let dataGradesString = data.grades[classStudent.name].map(JSON.stringify)

      let newGrades = grades.filter(grade => {
        return dataGradesString.indexOf(JSON.stringify(grade)) === -1
      })


      if (newGrades.length > 0) {
        let msg = `${getPrettyClassName(classStudent.name)}\nNova nota postada`
        await telegram.sendMessage(credentials.chatId,
          msg)
        data.grades[classStudent.name] = grades;
        saveData()
      }
    } catch (err) {
      console.log(err)
    }
  }
}

async function classNews(classes) {
  for (let classStudent of classes) { //for each class
    console.log(getPrettyClassName(classStudent.name))
    var newsList = await classStudent.getNews(); //this lists all news
    if (!data.news[classStudent.name]) data.news[classStudent.name] = []

    let newNews = newsList.filter(news => {
      return data.news[classStudent.name].indexOf(news.id) == -1
    })

    for (let news of newNews) { //for each news
      try {

        let msg = `${getPrettyClassName(classStudent.name)}\n`     +
                  `${news.name}\n\n`    +
                  `${await news.getContent()}\n\n` +
                  `Enviado em ${news.date} as ${await news.getTime()}`
        await telegram.sendMessage(credentials.chatId, msg)
        data.news[classStudent.name].push(news.id);
        saveData()
      } catch (err) {
        console.log(err)
      }
    }

  }
}


async function classTopics(classes) {
  for (let classStudent of classes) { //for each class
    try {
      console.log(getPrettyClassName(classStudent.name))
      var topics = await classStudent.getTopics(); //this lists all topics
      if (!data.topics[classStudent.name]) data.topics[classStudent.name] = []

      let dataTopicsWithoutAttachmentString = data.topics[classStudent.name].map((topic) => {
        let topicClone = JSON.parse(JSON.stringify(topic))
        delete topicClone.attachments;
        return JSON.stringify(topicClone);
      })

      for (let topic of topics) { //for each topic
        let topicObj = {
          "name": topic.name,
          "contentText": topic.contentText,
          "startDate": topic.startDate,
          "endDate": topic.endDate
        }
        let topicIndex = dataTopicsWithoutAttachmentString.indexOf(JSON.stringify(topicObj))
        topicObj.attachments = []
        if (topicIndex === -1) {
          let date = topic.startDate === topic.endDate ? removeYear(topic.startDate) : removeYear(topic.startDate) + " - " + removeYear(topic.endDate);
          let msg = `${getPrettyClassName(classStudent.name)}\n` +
          `${topic.name}\n`       +
          `${date}\n`             +
          `${topic.contentText}`
          await telegram.sendMessage(credentials.chatId, msg)
          topicObj.attachments = []
          data.topics[classStudent.name].push(topicObj)
          topicIndex = data.topics[classStudent.name].length - 1
          saveData()
        }
        topicObj.attachments = []


        for (let attachment of topic.attachments) {

          if (data.topics[classStudent.name][topicIndex].attachments.indexOf(attachment.id) === -1) {
            try {
              if (attachment.type == 'file') {
                let filepath = await attachment.downloadFile(BaseDestiny)
                let fileExtension = path.extname(filepath)
                let photoExtension = ['.jpg', '.png', '.gif']

                if (photoExtension.indexOf(fileExtension) > -1) {
                  await telegram.sendPhoto(credentials.chatId, {
                    source: filepath
                  })
                } else {
                  await telegram.sendDocument(credentials.chatId, {
                    source: filepath
                  })
                }
                data.topics[classStudent.name][topicIndex].attachments.push(attachment.id)
                saveData()
                await new Promise((resolve) => {
                  fs.unlink(filepath, (err) => {
                    if (err) {
                      console.error(err)
                    }
                    resolve()
                  })
                })
              }
            } catch (err) {
              console.log(err)
            }
          }
        }
      }
    } catch (err) {
      console.log(err)
    }
  }
}

