var express = require('express');
var mongoose = require('mongoose');
var app = express();
var socketio = require('socket.io');
var http = require('http');
var fs = require('fs');
var url = require('url');
var mime = require('mime');
var User = require('./model/users.js');
var jwt = require('jsonwebtoken');
let moment = require('moment');
var Promise = require('promise');
var jwtSecret = 'secret';

var server = http.createServer(app);
var Server = server.listen(3000, function() {
  console.log("Express server has started on port 3000")
});

app.use(function(req, res, next) {
  var parsedUrl = url.parse(req.url);
  var resource = parsedUrl.pathname;

  if (resource.indexOf('/uploads/') == 0) {
    // 4. 서비스 하려는 파일의 mime type

    var imgPath = resource.substring(1);
    console.log('imgPath=' + imgPath);
    var imgMime = mime.getType(resource); // lookup -> getType으로 변경됨
    console.log('mime=' + imgMime);

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

var room_id = 0; //룸 아이디
var gamequeue = new Array();
var roomuserinfo = {};
var count = 0;

var io = socketio.listen(Server);
io.sockets.on('connection', function(socket) {
  count++;
  console.log("count : " + count);

  socket.on('disconnect', function() {
     console.log('DISCONNESSO!!! ');
     console.log("count : " + count);
     count--;
    });
  socket.on('findroom', function(data) {
    const makeroom = function()
    {
      return new Promise(function(resolve,reject){
        for (var i = 0; i < 2; i++) {
          if (gamequeue[i] === null || gamequeue[i] === undefined) {
            gamequeue[i] = socket.id;
            break;
          }
        }
        resolve(gamequeue);
      });
    }
    const makeroom2 = function(gamequeue)
    {
      return new Promise(function(resolve,reject){
        if(gamequeue.length == 2)
        {
          for (var i = 0; i < gamequeue.length; i++) {
            io.to(gamequeue[i]).emit('makeroom', {
              room: room_id
            });
            console.log("gamequeue유저 : " + gamequeue[i]);
          }
          resolve(gamequeue);
        }
      });
    }
    const makeroom3 = function(gamequeue)
    {
      return new Promise(function(resolve,reject){
        gamequeue = [];
        room_id++;
      });
    }

    makeroom(true).then(makeroom2).then(function(result){
      gamequeue = [];
      room_id++;
      console.log('makeroom');
    });
  });

  socket.on('SaveProfile', function(data) {
    console.log("데이터 : " + JSON.stringify(data));

    mongoose.model('user').findOneAndUpdate({
      Email: data.Email
    }, {
      $set: {
        Introduce: data.introduce,
        Hobbit1: data.interset1,
        Hobbit2: data.interest2,
        Hobbit3: data.interest3
      }
    }, {
      upsert: true
    }, function(err, doc) {
      if (err) {
        socket.emit('SaveProfile', {
          result: false
        });
      } else if (doc) {
        console.log("성공");
        socket.emit('SaveProfile', {
          result: true
        });
      } else if (!doc) {
        socket.emit('SaveProfile', {
          result: false
        });
      }
    });
  });

  socket.on('findroomcancel', function(data) {
    var queueindex = gamequeue.indexOf(socket.id);
    gamequeue[queueindex] = null;
    gamequeue.filter(function(val) {
      return val !== null;
    })
  });

  socket.on('defaultProfile', function(userEmail) {
    mongoose.model('user').findOneAndUpdate({
      Email: userEmail
    }, {
      $set: {
        Profile: null
      }
    }, {
      upsert: true
    }, function(err, doc) {
      if (err) {
        socket.emit('defaultProfile', {
          result: false
        });
      } else if (doc) {
        console.log("성공");
        socket.emit('defaultProfile', {
          result: true
        });
      } else if (!doc) {
        socket.emit('defaultProfile', {
          result: false
        });
      }
    });
  });

  socket.on('returnUser', function(userEmail) {

    mongoose.model('user').findOne({
        Email: userEmail
      })
      .exec(function(err, user) {
        if (err) {
          socket.emit('returnUser', {
            type: false,
            data: "Error occured " + err
          });
        } else if (!user) {
          socket.emit('returnUser', {
            type: false,
            data: "Incorrect email"
          });
        } else if (user) {
          socket.emit('returnUser', {
            type: true,
            data: user
          });
        }
      });
  });

  socket.on('tokenverify', function(token) {
    if (token == "Logout") {
      socket.emit('verifyResponse', "Logout");

    } else {
      try {
        let decoded = jwt.verify(token, jwtSecret);
        console.log("토큰인증완료 : " + socket.id);
        socket.emit('verifyResponse', {
          token: decoded
        });
      } catch (e) {
        console.log("토큰인증실패 : " + e);
        socket.emit('verifyResponse', {
          token: "Failed"
        });
      }
    }
  });

  socket.on('joinroom', function(room) {
    socket.room = room;

    var myroom = socket.room;
    console.log('myroom : ' + myroom);
    socket.join(myroom);
  });

  socket.on('joinroomsucces',function(data)
  {
    console.log("joinroomsucces : " + socket.id);

    socket.emit('ServerMessage', {
      type: "System",
      data: "text",
      content: "방에 입장하셨습니다.",
      email: "System",
      nickname: "System",
      date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
    });

    socket.emit('OfferSubject', {
      subject: "안녕하세요 지금 보여지는 이 것은 토론 주제입니다",
      time: 30000
    });

    socket.on('AgreeOrOppose', function(data) {
      var userroom = socket.room;
      var userEmail = data.Email;

      if(roomuserinfo[userroom] == undefined)
      {
        roomuserinfo[userroom] = {};
      }

      roomuserinfo[userroom][userEmail] = {
        Opinion: data.Opinion
      };

      for (var key in roomuserinfo) {
        console.log("-------------------------------------------------------------------------")
        console.log("Attribute : " + key + ", value : " + JSON.stringify(roomuserinfo[key]));
        console.log("-------------------------------------------------------------------------")
      }

      // if(roomuserinfo.keys(userroom).length == 2)
      // {
      //   console.log("찬성 반대 몰표 확인 및 몰표면 Offersubject");
      // }
    }); //찬성 반대 몰표가 아니라면 게임 시작 몰표라면 주제 재지정

    // setTimeout(function(){
    //   socket.emit('Offersubject',{
    //     subject: "주제",
    //     time: 30000
    //   });
    // },30000);
  });

  socket.on('leaveRoom', function(data) {
    socket.leave(socket.room); //룸퇴장
    socket.room = null;
    console.log('OUT ROOM LIST', io.sockets.adapter.rooms);
  });

  socket.on('ClientMessage', function(data) {
    console.log("데이터 : " + data);
    data.date = moment().format("YYYY년 MM월 DD일 HH:mm:ss");
    io.sockets.in(socket.room).emit('ServerMessage', data); //자신포함 전체 룸안의 유저
  });

  socket.on('ClientMessagevideo', function(data, binarydata) {
    console.log("데이터 : " + data);
    data.date = moment().format("YYYY년 MM월 DD일 HH:mm:ss");
    io.sockets.in(socket.room).emit('ServerVideoMessage', data, binarydata); //자신포함 전체 룸안의 유저
  });
});

var login = require('./routes/login.js')(app, User);
var signup = require('./routes/signup.js')(app, User);
var uploadprofile = require('./routes/uploadprofile.js')(app, User);

app.use('/login', login);
app.use('/signup', signup);
app.use('/uploadprofile', uploadprofile);

// CONNECT TO MONGODB SERVER
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
  // CONNECTED TO MONGODB SERVER
  console.log("Connected to mongod server");
});

mongoose.connect('mongodb://localhost:27017/chatground_user', {
  useNewUrlParser: true
});
