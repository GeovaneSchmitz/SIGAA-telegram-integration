const Sigaa = require("sigaa-api")

const https = require('https');
const fs = require('fs');
const uuid = require('uuid/v4');
const path = require('path');
const querystring = require('querystring');
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
  await sigaa.account
    .login(credentials.username, credentials.password) // login
    .then(res => {
      /* res = {
        status:'LOGGED',
        userType:'STUDENT',
        token: random string
      }
      */
      if (res.userType === 'STUDENT') {
        token = res.token; // this stores access token
        return sigaa.classStudent.getClasses(res.token); // this return a array with all classes
      } else {
        throw 'user is not a student'
      }
    })
    .then(classes => {
      return new Promise((resolve, reject) => {
        classTopics(classes)
          .then(() => resolve(classes))
          .catch((e) => { console.log })
      })
    })
    
    .then(classes => {
      return new Promise((resolve, reject) => {
        classGrades(classes)
          .then(() => resolve(classes))
          .catch((e) => { console.log })

      })
    })
    
    .then((classes) => {
      return classNews(classes) // logoff afeter finished downloads 
    })
    .then(() => {
      return sigaa.account.logoff(token) // logoff afeter finished downloads 
    })
    .then(() => {
      process.exit(0)
    })
    .catch(data => {
      console.log(data);
    });
}



async function classGrades(classes) {
  for (let studentClass of classes) { //for each class
    console.log(studentClass.name)
    var grades = await sigaa.classStudent.getGrades(
      studentClass.id,
      token
    ); //this lists all grades
    if (!data.grades[studentClass.name]) data.grades[studentClass.name] = []

    let dataGradesString = data.grades[studentClass.name].map(JSON.stringify)

    let newGrades = grades.filter(grade => {
      return dataGradesString.indexOf(JSON.stringify(grade)) === -1
    })

    data.grades[studentClass.name] = grades;
    saveData()
    if (newGrades.length > 0) {

      let msg = `${escapeMsg(studentClass.name)}\nNova nota postada`

      await telegram.sendMessage(credentials.chatId,
        msg, { parse_mode: "html" })

    }
  }
}

async function classNews(classes) {
  for (let studentClass of classes) { //for each class
    console.log(studentClass.name)
    var news = await sigaa.classStudent.getNewsIndex(
      studentClass.id,
      token
    ); //this lists all news
    if (!data.news[studentClass.name]) data.news[studentClass.name] = []

    let dataNewsString = data.news[studentClass.name].map(JSON.stringify)

    let newNews = news.filter(news => {
      let cloneNews = JSON.parse(JSON.stringify(news))
      delete cloneNews.newsId.postOptions["javax.faces.ViewState"]
      return dataNewsString.indexOf(JSON.stringify(cloneNews)) === -1
    })

    data.news[studentClass.name] = news.map(news => {
      let cloneNews = JSON.parse(JSON.stringify(news))
      delete cloneNews.newsId.postOptions["javax.faces.ViewState"]
      return cloneNews
    });
    saveData()
    for (let news of newNews) { //for each news
      let fullNews = await sigaa.classStudent.getNews(news.newsId, token)
      let date = removeYear(escapeMsg(fullNews.date))
      let msg = `${escapeMsg(studentClass.name)}\n<b>${escapeMsg(fullNews.name)}</b>\n${date}\n${escapeMsg(fullNews.content)}`

      await telegram.sendMessage(credentials.chatId,
        msg, { parse_mode: "html" })

    }
  }
}


async function classTopics(classes) {
  for (let studentClass of classes) { //for each class
    console.log(studentClass.name)
    var topics = await sigaa.classStudent.getTopics(
      studentClass.id,
      token
    ); //this lists all topics
    if (!data.topics[studentClass.name]) data.topics[studentClass.name] = []

    let dataTopicsString = data.topics[studentClass.name].map(JSON.stringify)
    let newTopics = topics.filter(topic => {
      let cloneTopic = JSON.parse(JSON.stringify(topic))
      if (cloneTopic.attachments) {
        for (let i = 0; i < cloneTopic.attachments.length; i++) {
          delete cloneTopic.attachments[i].form.postOptions["javax.faces.ViewState"]
        }
      }
      return dataTopicsString.indexOf(JSON.stringify(cloneTopic)) === -1
    })
    data.topics[studentClass.name] = topics.map(topic => {
      let cloneTopic = JSON.parse(JSON.stringify(topic))

      if (cloneTopic.attachments) {
        for (let i = 0; i < cloneTopic.attachments.length; i++) {
          delete cloneTopic.attachments[i].form.postOptions["javax.faces.ViewState"]
        }
      }
      return cloneTopic
    });
    saveData()

    for (let topic of newTopics) { //for each topic
      let date = topic.startDate === topic.endDate ? removeYear(topic.startDate) : removeYear(topic.startDate) + " - " + removeYear(topic.endDate);

      let msg = `${escapeMsg(studentClass.name)}\n<b>${escapeMsg(topic.name)}</b>\n${escapeMsg(date)}\n${escapeMsg(topic.contentText)}`

      await telegram.sendMessage(credentials.chatId,
        msg, { parse_mode: "html" })
      for (let attachment of topic.attachments) {
        if (attachment.type == 'file') {
          let filepath = await downloadFile(studentClass, attachment);
          let fileExtension = filepath.slice(-3)
          let photoExtension = ['jpg', 'png', 'gif']

          if (photoExtension.indexOf(fileExtension) > -1) {
            await telegram.sendPhoto(credentials.chatId, {
              source: filepath
            }).catch(e => console.log)
          } else {
            await telegram.sendDocument(credentials.chatId, {
              source: filepath
            }).catch(e => console.log)
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
      }
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
      file = fs.createWriteStream(filepath);
      response.pipe(file); //save to file
      file.on('finish', () => {
        file.close((err) => {
          if (err) {
            console.log(err.message)
            fs.unlink(filepath, (err) => {
              if (err) console.log(err.message);
              reject(false);
            });
          } else {
            resolve(filepath)
          }
        }); // close() is async, call resolve after close completes.
      });
      response.on('error', (err) => {
        console.log(err.message)
        file.close((err) => {
          if (err) console.log(err.message)
          fs.unlink(filepath, (err) => {
            if (err) console.log(err.message);
            reject(false);
          });
        });
      });
      file.on('error', (err) => {
        console.log(err.message)
        file.close((err) => {
          if (err) console.log(err.message)
          fs.unlink(filepath, (err) => {
            if (err) console.log(err.message);
            reject(false);
          });
        });
      });
      request.write(postOptionsString); //send post parameters
      request.end();
    });
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