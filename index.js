const Sigaa = require("sigaa-api")

const https = require('https');
const fs = require('fs');
const path = require('path');
const Telegram = require('telegraf/telegram')
const sigaa = new Sigaa({
  "cache": false
});

let saveData = () => {
  fs.writeFile(storeDataFilename, JSON.stringify(data), function (err) {
    if (err) throw err;
  }
  );
}

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
let BaseDestiny = path.join(__dirname, "downloads")
let token;

const telegram = new Telegram(credentials.token)

let getUpdate = async () => {
  let account = await sigaa.login(credentials.username, credentials.password) // login
  let classes = account.getClasses(res.token); // this return a array with all classes
  console.log("Topics")
  await classTopics(classes)
  console.log("News")
  await classNews(classes)
  console.log("grades")
  classGrades(classes)
  await account.logoff() // logoff afeter finished 
}



async function classGrades(classes) {
  for (let classStudent of classes) { //for each class
    try{
      console.log(classStudent.name)
      var grades = await classStudent.getGrades()
      if (!data.grades[classStudent.name]) data.grades[classStudent.name] = []

      let dataGradesString = data.grades[classStudent.name].map(JSON.stringify)

      let newGrades = grades.filter(grade => {
        return dataGradesString.indexOf(JSON.stringify(grade)) === -1
      })

      
      if (newGrades.length > 0) {
        let msg = `${escapeMsg(classStudent.name)}\nNova nota postada`
        await telegram.sendMessage(credentials.chatId,
          msg, { parse_mode: "html" })
        data.grades[classStudent.name] = grades;
        saveData()
      }
    }catch(err){
      console.log(err)
    }
  }
}

async function classNews(classes) {
  for (let classStudent of classes) { //for each class
      try{
      console.log(classStudent.name)
      var newsIndexList = await classStudent.getNewsIndex(); //this lists all news
      if (!data.news[classStudent.name]) data.news[classStudent.name] = []

      let dataNewsString = data.news[classStudent.name].map(JSON.stringify)

      let newNews = newsIndexList.filter(news => {
        let cloneNews = JSON.parse(JSON.stringify(news))
        delete cloneNews.newsId.postOptions["javax.faces.ViewState"]
        return dataNewsString.indexOf(JSON.stringify(cloneNews)) === -1
      })

      for (let news of newNews) { //for each news
        let fullNews = await sigaa.classStudent.getNews(news.newsId, token)
        let date = removeYear(escapeMsg(fullNews.date))
        let msg = `${escapeMsg(classStudent.name)}\n<b>${escapeMsg(fullNews.name)}</b>\n${date}\n${escapeMsg(fullNews.content)}`

        await telegram.sendMessage(credentials.chatId,
          msg, { parse_mode: "html" })
        delete cloneNews.newsId.postOptions["javax.faces.ViewState"]
        data.news[classStudent.name].push(news);
        saveData()
      }
    }catch(err){
      console.log(err)
    }
  }
}


async function classTopics(classes) {
  for (let classStudent of classes) { //for each class
    try{
      console.log(classStudent.name)
      var topics = await classStudent.getTopics(); //this lists all topics
      if (!data.topics[classStudent.name]) data.topics[classStudent.name] = []

      let dataTopicsString = data.topics[classStudent.name].map(JSON.stringify)

      for (let topic of topics) { //for each topic
        let topicObj ={
          "name": topic.name,
          "contentText": topic.contentText,
          "attachments": [],
          "startDate": topic.startDate,
          "endDate": topic.endDate
        }
        for(let attachment of topic.attachments){
          topicObj.push(attachment.id)
        }
        let topicIndex = dataTopicsString.indexOf(JSON.stringify(topicObj))
        if(topicIndex === -1){
          let date = topic.startDate === topic.endDate ? removeYear(topic.startDate) : removeYear(topic.startDate) + " - " + removeYear(topic.endDate);

          let msg = `${escapeMsg(classStudent.name)}\n<b>${escapeMsg(topic.name)}</b>\n${escapeMsg(date)}\n${escapeMsg(topic.contentText)}`
  
          await telegram.sendMessage(credentials.chatId,
            msg, { parse_mode: "html" })
          
        }
        for (let attachment of topic.attachments) {
          
          if(topicIndex === -1 || data.topics)
          try{
            if (attachment.type == 'file') {
              let filepath = await downloadFile(attachment)
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
              await new Promise((resolve) => {
                fs.unlink(filepath, (err) => {
                  if (err) {
                    console.error(err)
                  }
                  resolve()
                })
              })
            }

          } catch(err) {
            console.log(err)
          }
        }
      }
    }catch(err){
      console.log(err)
    }
  }
}
let removeYear = (date) => {
  return date.slice(0, date.lastIndexOf("/"))

}
let escapeMsg = (msg) => {
  return msg.replace(/\<p\>|'\n'|<br\/>|<br>|\t/gm, '\n').replace(
    /<script([\S\s]*?)>([\S\s]*?)<\/script>|&nbsp;|<style([\S\s]*?)style>|<([\S\s]*?)>|<[^>]+>| +(?= )|\t/gm,
    '')
}
async function downloadFile(attachment) {
  return await new Promise((resolve, reject) => {
    let file;

    let link = new URL(attachment.form.action);
    //http options
    const options = {
      hostname: link.hostname,
      port: 443,
      path: link.pathname + link.search,
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:64.0) Gecko/20100101 Firefox/64.0',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': token
      },
    };

    // this converts post parameters to string
    let postOptionsString = querystring.stringify(attachment.form.postOptions);
    // this inserts post parameters length to  header http
    options.headers['Content-Length'] = Buffer.byteLength(postOptionsString);

    // makes request
    var request = https.request(options, (response) => {
      let filename = response.headers['content-disposition'].replace(/([\S\s]*?)filename=\"/gm, '').slice(0, -1);
      let filepath = path.join(BaseDestiny, filename)
    
      console.log(filepath)
      file = fs.createWriteStream(filepath);
      response.pipe(file); //save to file
      file.on('finish', () => {
        file.close((err) => {
          if (err){
            console.log(err.message)
            fs.unlink(filepath, (err) => {
              if (err) console.log(err.message);
              reject(false);
            });
          }
        }); // close() is async, call resolve after close completes.
        resolve(filepath)
      });
      response.on('error', (err) => {
        console.log(err.message)
        file.close((err) => {
          if (err){
            console.log(err.message)
          }
        });
        fs.unlink(filepath, (err) => {
          if (err) console.log(err.message);
        });
        reject(false);

      });
      file.on('error', (err) => {
        console.log(err.message)
        file.close((err) => {
          if (err){
            console.log(err.message)
            fs.unlink(filepath, (err) => {
              if (err) console.log(err.message);
              reject(false);
            });
          }
        });
      });
    });
    request.write(postOptionsString); //send post parameters
    request.end();
  });
}
let request = false;
require("http")
  .createServer(async (req, res) => {
    res.statusCode = 200; res.write("ok");
    res.end();
    if (!request) {
      request = true
      await getUpdate();
      request = false
    }
  }).listen(process.env.PORT, () => console.log("Now listening on port " + process.env.PORT));
getUpdate().then(console.log).catch(console.log);
