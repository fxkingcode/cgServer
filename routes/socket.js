module.exports = (io) => {
  const User = require('../model/user');
  const moment = require('moment');

  var subject = [];
  setSubject(subject);
  var waiting = new Array();
  var room_id = 0; //룸 아이디
  var roomInfo = [];
  const personel = 2 //게임 시작 정원

  io.sockets.on('connection', function(socket) {
    console.log("연결");

    waiting.push(socket.id);
    if (waiting.length == personel) {
      var room = {};
      room.id = room_id;
      room.count = 0;
      room.subject = null;
      room.users = [];
      room.agree = 0;
      room.oppose = 0;

      roomInfo[room_id] = room;

      for (var i = 0; i < waiting.length; i++) {
        io.to(waiting[i]).emit('matchMaking', {
          room: room_id
        });
        console.log("room_id : " + room_id);
      }
      waiting = [];
      room_id++;
    }

    socket.on('disconnect', function() {
      waiting.splice(waiting.indexOf(socket.id),1);
    });

    socket.on('sendMessage', function(data) {
      var messageUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });

      var user = Object()
      user.type = data.type;
      user.content = data.content;
      user.date = moment();
      user.user = messageUser[0];
      if(data.binaryData) {
        user.binaryData = data.binaryData;
      }

      if (user.type == "strategicText" || user.type == "strategicImage" || user.type == "strategicVideo") {
        io.to(user.socket).emit('message', user);
      }else{
        io.sockets.in(data.room).emit('message', user);
      }
    });

    socket.on('join', function(data) {
      console.log("join : " + JSON.stringify(data));
      User.findOne()
        .where('_id').equals(data.user)
        .select('nickname profile introduce')
        .then(user => {
          if (user) {
            roomInfo[data.room].count++;
            roomInfo[data.room].users.push({
              socket: socket.id,
              _id: user._id,
              nickname: user.nickname,
              profile: user.profile,
              introduce: user.introduce,
              pass: false
            })
            socket.join(data.room);

            socket.emit('makeRoom', {
              users: roomInfo[data.room].users,
              room: data.room
            });
          } else {
            console.log("유저없음");
          }
        }).catch(err => {
          console.log("유저없음");
        })
    })

    socket.on('onMakeRoom', function(data) {
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        roomInfo[data.room].subject = subject[Math.floor(Math.random() * subject.length)];

        io.sockets.in(data.room).emit('offerSubject', {
          subject: roomInfo[data.room].subject,
          time: 30000
        });

        io.sockets.in(data.room).emit('roomInfoChange', {
          roomInfo: roomInfo[data.room]
        });

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('opinionResult', function(data) {
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].opinion = data.opinion;
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        var agreePass = false; //한명이라도 동의하면 true
        var opposePass = false; //한명이라도 동의하면 true

        for (var i in roomInfo[data.room].users) {
          if (roomInfo[data.room].users[i].opinion == 'agree') {
            agreePass = true;
          }
          if (roomInfo[data.room].users[i].opinion == 'oppose') {
            opposePass = true;
          }
        }

        if (agreePass && opposePass) //다음단계
        {
          io.sockets.in(data.room).emit('roomInfoChange', {
            roomInfo: roomInfo[data.room]
          });
          io.sockets.in(data.room).emit('message', {
            type: "system",
            content: "찬성 측의 간단한 기초 주장 차례입니다.",
            date: moment(),
          });
          io.sockets.in(data.room).emit('presentationOrder', {
            time: 60000,
            order: "agreePresentationComplete",
            speaking: "agree"
          });

        } else { //다시 offerSubject
          roomInfo[data.room].subject = subject[Math.floor(Math.random() * subject.length)];
          io.sockets.in(data.room).emit('offerSubject', {
            subject: roomInfo[data.room].subject,
            time: 30000
          });
        }

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('agreePresentationComplete', function(data) {
      console.log("agreePresentationComplete");
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        io.sockets.in(data.room).emit('message', {
          type: "system",
          content: "반대 측의 간단한 기초 주장 차례입니다.",
          date: moment(),
        });
        io.sockets.in(data.room).emit('presentationOrder', {
          time: 60000,
          order: "opposePresentationComplete",
          speaking: "oppose"
        });

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('opposePresentationComplete', function(data) {
      console.log("opposePresentationComplete");
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        io.sockets.in(data.room).emit('message', {
          type: "system",
          content: "반대 측 의견에 대한 찬성 측 반론을 말해주십시오.",
          date: moment(),
        });
        io.sockets.in(data.room).emit('presentationOrder', {
          time: 180000,
          order: "agreeCounterComplete",
          speaking: "agree"
        });

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('agreeCounterComplete', function(data) {
      console.log("agreeCounterComplete");
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        io.sockets.in(data.room).emit('message', {
          type: "system",
          content: "찬성 측 의견에 대한 반대 측 반론을 말해주십시오.",
          date: moment(),
        });
        io.sockets.in(data.room).emit('presentationOrder', {
          time: 180000,
          order: "opposeCounterComplete",
          speaking: "oppose"
        });

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('opposeCounterComplete', function(data) {
      console.log("opposeCounterComplete");
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        io.sockets.in(data.room).emit('message', {
          type: "system",
          content: "작전 시간입니다.",
          date: moment(),
        });
        io.sockets.in(data.room).emit('presentationOrder', {
          time: 180000,
          order: "strategicTimeComplete",
          speaking: "all"
        });

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('strategicTimeComplete', function(data) {
      console.log("strategicTimeComplete");
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        io.sockets.in(data.room).emit('message', {
          type: "system",
          content: "반대 측 의견에 대한 찬성 측 반론을 말해주십시오.",
          date: moment(),
        });
        io.sockets.in(data.room).emit('presentationOrder', {
          time: 180000,
          order: "agreeCounterComplete2",
          speaking: "agree"
        });

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('agreeCounterComplete2', function(data) {
      console.log("agreeCounterComplete2");
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        io.sockets.in(data.room).emit('message', {
          type: "system",
          content: "찬성 측 의견에 대한 반대 측 반론을 말해주십시오.",
          date: moment(),
        });
        io.sockets.in(data.room).emit('presentationOrder', {
          time: 180000,
          order: "opposeCounterComplete2",
          speaking: "oppose"
        });

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('opposeCounterComplete2', function(data) {
      console.log("opposeCounterComplete2");
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        io.sockets.in(data.room).emit('message', {
          type: "system",
          content: "작전 시간입니다.",
          date: moment(),
        });
        io.sockets.in(data.room).emit('presentationOrder', {
          time: 180000,
          order: "strategicTimeComplete2",
          speaking: "all"
        });

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('strategicTimeComplete2', function(data) {
      console.log("strategicTimeComplete2");
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        io.sockets.in(data.room).emit('message', {
          type: "system",
          content: "자유논박 시간입니다.",
          date: moment(),
        });
        io.sockets.in(data.room).emit('presentationOrder', {
          time: 360000,
          order: "freeTalkTimeComplete",
          speaking: "all"
        });

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('freeTalkTimeComplete', function(data) {
      console.log("freeTalkTimeComplete");
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        io.sockets.in(data.room).emit('message', {
          type: "system",
          content: "찬성 측의 의견을 요약하여 주십시오.",
          date: moment(),
        });
        io.sockets.in(data.room).emit('presentationOrder', {
          time: 90000,
          order: "agreeSummarizeComplete",
          speaking: "agree"
        });

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('agreeSummarizeComplete', function(data) {
      console.log("agreeSummarizeComplete");
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        io.sockets.in(data.room).emit('message', {
          type: "system",
          content: "반대 측의 의견을 요약하여 주십시오.",
          date: moment(),
        });
        io.sockets.in(data.room).emit('presentationOrder', {
          time: 90000,
          order: "opposeSummarizeComplete",
          speaking: "oppose"
        });

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('opposeSummarizeComplete', function(data) {
      console.log("opposeSummarizeComplete");
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });
      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) {
        io.sockets.in(data.room).emit('message', {
          type: "system",
          content: "재투표를 시작합니다.",
          date: moment(),
        });
        io.sockets.in(data.room).emit('reVoting', {
          time: 30000
        });

        roomInfo[data.room].users.forEach(user => {
          user.pass = false
        });
      }
    });

    socket.on('reVoteResult', function(data) {
      console.log("reVoteResult");
      var myUser = roomInfo[data.room].users.filter(function(user) {
        return user._id == data.user
      });

      if (myUser[0].opinion == "agree") {
        if (data.reVote == "oppose" || data.reVote == "neutrality") {
          roomInfo[data.room].oppose++;
        }
      }

      if (myUser[0].opinion == "oppose") {
        if (data.reVote == "agree" || data.reVote == "neutrality") {
          roomInfo[data.room].agree++;
        }
      }

      if (myUser[0].opinion == "neutrality") {
        if (data.reVote == "agree") {
          roomInfo[data.room].agree++;
        }
        if (data.reVote == "oppose") {
          roomInfo[data.room].oppose++;
        }
      }

      myUser[0].pass = true;

      var pass = true;

      roomInfo[data.room].users.forEach(user => {
        if (user.pass == false) {
          pass = false
        }
      });

      if (pass) { //게임 끝
        if (roomInfo[data.room].agree > roomInfo[data.room].oppose) {
          io.sockets.in(data.room).emit('message', {
            type: "system",
            content: "찬성 승리",
            date: moment(),
          });
          io.sockets.in(data.room).emit('result', {
            winner: "agree"
          });

          io.of('/').in(data.room).clients((error, socketIds) => {
            if (error) throw error;

            socketIds.forEach(socketId => io.sockets.sockets[socketId].leave(data.room));
          });
        }

        if (roomInfo[data.room].agree < roomInfo[data.room].oppose) {
          io.sockets.in(data.room).emit('message', {
            type: "system",
            content: "반대 승리",
            date: moment(),
          });
          io.sockets.in(data.room).emit('result', {
            winner: "oppose"
          });
          io.of('/').in(data.room).clients((error, socketIds) => {
            if (error) throw error;

            socketIds.forEach(socketId => io.sockets.sockets[socketId].leave(data.room));
          });
        }

        if (roomInfo[data.room].agree == roomInfo[data.room].oppose) {
          io.sockets.in(data.room).emit('message', {
            type: "system",
            content: "무승부",
            date: moment(),
          });
          io.sockets.in(data.room).emit('result', {
            winner: "neutrality"
          });
          io.of('/').in(data.room).clients((error, socketIds) => {
            if (error) throw error;

            socketIds.forEach(socketId => io.sockets.sockets[socketId].leave(data.room));
          });
        }

        roomInfo[data.room] = null;

        console.log("room" + roomInfo[data.room]);
      }
    });

    socket.on('leaveRoom', function(data) {
      const idx = roomInfo[data.room].users.findIndex(function(item) {
        return item._id === data.user
      })
      roomInfo[data.room].users.splice(idx, 1);
      roomInfo[data.room].count--;
      io.sockets.in(data.room).emit('roomInfoChange', {
        roomInfo: roomInfo[data.room]
      });

      socket.leave(data.room); //룸퇴장
    });
  });

  function setSubject(subject) {
    subject[0] = '신은 존재한다.'
    subject[1] = '국내 최저시급은 만원까지 인상되어야 한다.'
    subject[2] = '인간의 이익을 위해 동물실험은 계속되어야 한다.'
    subject[3] = '사형제도는 유지되어야 한다.'
    subject[4] = '탈원전은 필수적으로 해야 한다.'
    subject[5] = '한국의 코로나 대처는 훌륭한 수준이다.'
    subject[6] = '탕수육은 소스에 찍어서 먹어야 한다.'
  }
}
