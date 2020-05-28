const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');
const url = require('url');
const mime = require('mime');
const moment = require('moment');
const Promise = require('promise');
const autoIncrement = require('mongoose-auto-increment');

//라우터
const indexRouter = require('./routes/index');//인덱스라우터
const authRouter = require('./routes/auth');//회원가입,로그인 등등
const forumRouter = require('./routes/forum');//글작성,보기,수정,삭제,댓글
const profileRouter = require('./routes/profile');//유저 정보 보기,수정,프로필

const app = express();

const server = http.createServer(app);
const Server = server.listen(3000, function() {
  console.log("Express server has started on port 3000")
});
const io = socketio.listen(Server);
require('./routes/socket')(io);

app.use(function(req, res, next) {
  var parsedUrl = url.parse(req.url);
  var resource = parsedUrl.pathname;

  if (resource.indexOf('/profileImages/') == 0 || resource.indexOf('/forumImages/') == 0) {
    // 4. 서비스 하려는 파일의 mime type

    var imgPath = resource.substring(1);
    var imgMime = mime.getType(resource); // lookup -> getType으로 변경됨

    fs.readFile(imgPath, function(error, data) {
      if (error) {
        res.writeHead(500, {
          'Content-Type': 'text/html'
        });
        res.end('500 Internal Server ' + error);
      } else {
        // 6. Content-Type 에 4번에서 추출한 mime type 을 입력
        res.writeHead(200, {
          'Content-Type': imgMime
        });
        res.end(data);
      }
    });
  } else {
    next();
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//라우터 주소 설정
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/forum', forumRouter);
app.use('/profile', profileRouter);

// CONNECT TO MONGODB SERVER
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
  // CONNECTED TO MONGODB SERVER
  console.log("Connected to mongod server");
});

const connect = mongoose.connect('mongodb://localhost:27017/chatground', {
  useNewUrlParser: true
});
mongoose.set('useFindAndModify', false);

module.exports = app;
