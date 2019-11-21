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
var subject = [];
subject[0] = '이것은 토론 주제입니다 0'
subject[1] = '이것은 토론 주제입니다 1'
subject[2] = '이것은 토론 주제입니다 2'
subject[3] = '이것은 토론 주제입니다 3'
subject[4] = '이것은 토론 주제입니다 4'
subject[5] = '이것은 토론 주제입니다 5'
subject[6] = '이것은 토론 주제입니다 6'
subject[7] = '이것은 토론 주제입니다 7'
subject[8] = '이것은 토론 주제입니다 8'

var test = [];

var test2 = [];//AgreeOpinionComplete

var OfferSubject = function(room)
{
  if(test[room] === undefined)
  {
    test[room] = subject[Math.floor(Math.random() * subject.length)];
  }//test 나중에 방 터질 떄 다시 undefined로 돌려줘야함

  io.sockets.in(room).emit('OfferSubject', {
    subject: test[room],
    time: 30000
  });
}

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

    if(test[socket.room] === undefined)
    {
      test[socket.room] = subject[Math.floor(Math.random() * subject.length)];
    }//test 나중에 방 터질 떄 다시 undefined로 돌려줘야함

    socket.emit('OfferSubject', {
      subject: test[socket.room],
      time: 30000
    });
  });

  socket.on('AgreeOrOppose', function(data) {
    var userroom = socket.room;
    var userEmail = data.Email;

    if(roomuserinfo[userroom] === undefined)
    {
      roomuserinfo[userroom] = {};
    }

    roomuserinfo[userroom][userEmail] = {
      Opinion: data.Opinion,
      Socketid: socket.id
    };

    var obj_length = Object.keys(roomuserinfo[userroom]).length;

    if(obj_length == 2)//나중에 room의 인원만큼으로 바꾸기
    {
      io.sockets.in(socket.room).emit('VoteComplete'); //자신포함 전체 룸안의 유저

      var opiarray = new Array();
      var y = 0;

      for(var i in roomuserinfo[userroom])
      {
        if(roomuserinfo[userroom][i]['Opinion'] != 'giveup')
        {
          opiarray[y] = roomuserinfo[userroom][i]['Opinion'];
          y++;
        }
      }

      if(opiarray.length <= 1)//배열의 크기가 1보다 작거나 같다면 주제 다시 전송
      {
        OfferSubject(socket.room);
        roomuserinfo[userroom] = {};
        test[socket.room] = undefined;
      }
      else {
        var pass = false;
        for(var i = 0; i < opiarray.length-1;i++)
        {
          if(opiarray[i] != opiarray[i+1])//찬반이 한명이라도 다르면 게임 시작
          {
            pass = true;
            break;
          }
        }

        if(pass == true)
        {
          console.log("게임시작");
          io.sockets.in(socket.room).emit('PresentationOrder', {
            time: 60000,
            result: roomuserinfo[socket.room],
            order: "AgreeOpinionComplete",
            speaking: "agree"
          });
          io.sockets.in(socket.room).emit('ServerMessage', {
            type: "System",
            data: "text",
            content: "찬성 측의 간단한 기초 주장 차례입니다.",
            email: "System",
            nickname: "System",
            date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
          });
        }
        else {
          OfferSubject(socket.room);
          roomuserinfo[userroom] = {};
          test[socket.room] = undefined;
        }
      }
    }
  }); //찬성 반대 몰표가 아니라면 게임 시작 몰표라면 주제 재지정

  socket.on('AgreeOpinionComplete', function(data){
    console.log("AgreeOpinionComplete");
    if(test2[socket.room] === undefined)
    {
      test2[socket.room] = 0
    }
    test2[socket.room]++;

    if(test2[socket.room] == 2)
    {
      io.sockets.in(socket.room).emit('PresentationOrder', {
        time: 60000,
        result: roomuserinfo[socket.room],
        order: "OpposeOpinionComplete",
        speaking: "oppose"
      });
      io.sockets.in(socket.room).emit('ServerMessage', {
        type: "System",
        data: "text",
        content: "반대 측의 간단한 기초 주장 차례입니다.",
        email: "System",
        nickname: "System",
        date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
      });

      test2[socket.room] = 0
    }
  });

  socket.on('OpposeOpinionComplete', function(data){
    console.log("OpposeOpinionComplete");

    test2[socket.room]++;

    if(test2[socket.room] == 2)
    {
      io.sockets.in(socket.room).emit('PresentationOrder', {
        time: 180000,
        result: roomuserinfo[socket.room],
        order: "OpposeCounterComplete",
        speaking: "oppose"
      });
      io.sockets.in(socket.room).emit('ServerMessage', {
        type: "System",
        data: "text",
        content: "찬성 측 의견에 대한 반대 측 반론을 말해주십시오.",
        email: "System",
        nickname: "System",
        date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
      });

      test2[socket.room] = 0
    }
  });

  socket.on('OpposeCounterComplete', function(data){
    console.log("OpposeCounterComplete");

    test2[socket.room]++;

    if(test2[socket.room] == 2)
    {
      io.sockets.in(socket.room).emit('PresentationOrder', {
        time: 180000,
        result: roomuserinfo[socket.room],
        order: "AgreeCounterComplete",
        speaking: "agree"
      });
      io.sockets.in(socket.room).emit('ServerMessage', {
        type: "System",
        data: "text",
        content: "반대 측 의견에 대한 찬성 측 반론을 말해주십시오.",
        email: "System",
        nickname: "System",
        date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
      });

      test2[socket.room] = 0
    }
  });

  socket.on('AgreeCounterComplete', function(data){
    console.log("AgreeCounterComplete");

    test2[socket.room]++;

    if(test2[socket.room] == 2)
    {
      io.sockets.in(socket.room).emit('PresentationOrder', {
        time: 180000,
        result: roomuserinfo[socket.room],
        order: "StrategicTimeComplete",
        speaking: "all"
      });

      io.sockets.in(socket.room).emit('StrategicTime', {
        roomuserinfo: roomuserinfo[socket.room]
      });

      io.sockets.in(socket.room).emit('ServerMessage', {
        type: "System",
        data: "text",
        content: "작전 시간입니다.",
        email: "System",
        nickname: "System",
        date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
      });

      test2[socket.room] = 0
    }
  });

  socket.on('leaveRoom', function(data) {
    socket.leave(socket.room); //룸퇴장
    socket.room = null;
    console.log('OUT ROOM LIST', io.sockets.adapter.rooms);
  });

  socket.on('ClientMessage', function(data) {
    console.log("데이터 : " + data);
    data.date = moment().format("YYYY년 MM월 DD일 HH:mm:ss");

    if(data.data == "Strategictext")
    {
      if(roomuserinfo[socket.room][data.email]['Opinion'] == "agree")
      {
        data.data = "Strategictext_a";
        for(var i in roomuserinfo[socket.room])
        {
          if(roomuserinfo[socket.room][i]['Opinion'] == "agree")
          {
            io.to(roomuserinfo[socket.room][i]['Socketid']).emit('ServerMessage',data);
          }
        }
      }
      else if(roomuserinfo[socket.room][data.email]['Opinion'] == "oppose")
      {
        data.data = "Strategictext_o";
        for(var i in roomuserinfo[socket.room])
        {
          if(roomuserinfo[socket.room][i]['Opinion'] == "oppose")
          {
            io.to(roomuserinfo[socket.room][i]['Socketid']).emit('ServerMessage',data);
          }
        }
      }
      else {
        data.data = "Strategictext_g";
        for(var i in roomuserinfo[socket.room])
        {
          if(roomuserinfo[socket.room][i]['Opinion'] == "giveup")
          {
            io.to(roomuserinfo[socket.room][i]['Socketid']).emit('ServerMessage',data);
          }
        }
      }
    }
    else {
      io.sockets.in(socket.room).emit('ServerMessage', data); //자신포함 전체 룸안의 유저
    }
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
