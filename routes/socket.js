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

      data.date = moment();
      data.user = messageUser[0];

      if (data.type == "strategic") {
        if (data.content == "image" || data.content == "video") {
          data.type = data.content;
          io.sockets.in(data.room).emit('message', data);
        } else {
          roomInfo[data.room].users.forEach(user => {
            if (user.opinion == messageUser[0].opinion) {
              io.to(user.socket).emit('message', data);
            }
          });
        }
      }

      if (data.type == "text") {
        io.sockets.in(data.room).emit('message', data); //자신포함 전체 룸안의 유저
      }

      if (data.type == "image" || data.type == "video") {
        io.sockets.in(data.room).emit('message', data);
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
            users: roomInfo[data.room].users,
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
          users: roomInfo[data.room].users,
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
          users: roomInfo[data.room].users,
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
          users: roomInfo[data.room].users,
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
          users: roomInfo[data.room].users,
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
          users: roomInfo[data.room].users,
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
          users: roomInfo[data.room].users,
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
          users: roomInfo[data.room].users,
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
          users: roomInfo[data.room].users,
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
          users: roomInfo[data.room].users,
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
          users: roomInfo[data.room].users,
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


// var room_id = 0; //룸 아이디
// var gamequeue = new Array();
// var roomuserinfo = {};
// var count = 0;
// var subject = [];
// subject[0] = '이것은 토론 주제입니다 0'
// subject[1] = '이것은 토론 주제입니다 1'
// subject[2] = '이것은 토론 주제입니다 2'
// subject[3] = '이것은 토론 주제입니다 3'
// subject[4] = '이것은 토론 주제입니다 4'
// subject[5] = '이것은 토론 주제입니다 5'
// subject[6] = '이것은 토론 주제입니다 6'
// subject[7] = '이것은 토론 주제입니다 7'
// subject[8] = '이것은 토론 주제입니다 8'
//
// var test = [];
//
// var test2 = []; //AgreeOpinionComplete
//
// var OfferSubject = function(room) {
//   if (test[room] === undefined) {
//     test[room] = subject[Math.floor(Math.random() * subject.length)];
//   } //test 나중에 방 터질 떄 다시 undefined로 돌려줘야함
//
//   io.sockets.in(room).emit('OfferSubject', {
//     subject: test[room],
//     time: 30000
//   });
// }
//
// var io = socketio.listen(Server);
// io.sockets.on('connection', function(socket) {
//   count++;
//   console.log("count : " + count);
//
//   socket.on('disconnect', function() {
//     console.log('DISCONNESSO!!! ');
//     console.log("count : " + count);
//     count--;
//   });
//
//
//
//   socket.on('findroom', function(data) {
//     const makeroom = function() {
//       return new Promise(function(resolve, reject) {
//         for (var i = 0; i < 2; i++) {
//           if (gamequeue[i] === null || gamequeue[i] === undefined) {
//             gamequeue[i] = socket.id;
//             break;
//           }
//         }
//         resolve(gamequeue);
//       });
//     }
//     const makeroom2 = function(gamequeue) {
//       return new Promise(function(resolve, reject) {
//         if (gamequeue.length == 2) {
//           for (var i = 0; i < gamequeue.length; i++) {
//             io.to(gamequeue[i]).emit('makeroom', {
//               room: room_id
//             });
//             console.log("gamequeue유저 : " + gamequeue[i]);
//           }
//           resolve(gamequeue);
//         }
//       });
//     }
//     const makeroom3 = function(gamequeue) {
//       return new Promise(function(resolve, reject) {
//         gamequeue = [];
//         room_id++;
//       });
//     }
//
//     makeroom(true).then(makeroom2).then(function(result) {
//       gamequeue = [];
//       room_id++;
//       console.log('makeroom');
//     });
//   });
//
//
//   socket.on('findroomcancel', function(data) {
//     var queueindex = gamequeue.indexOf(socket.id);
//     gamequeue[queueindex] = null;
//     gamequeue = gamequeue.filter(function(val) {
//       return val !== null;
//     });
//
//     console.log("findroomcancel");
//   });
//
//
//
//   socket.on('joinroom', function(room) {
//     socket.room = room;
//
//     var myroom = socket.room;
//     console.log('myroom : ' + myroom);
//     socket.join(myroom);
//   });
//
//   socket.on('joinroomsucces', function(data) {
//     console.log("joinroomsucces : " + socket.id);
//
//     socket.emit('ServerMessage', {
//       type: "System",
//       data: "text",
//       content: "방에 입장하셨습니다.",
//       email: "System",
//       nickname: "System",
//       date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//     });
//
//     if (test[socket.room] === undefined) {
//       test[socket.room] = subject[Math.floor(Math.random() * subject.length)];
//     } //test 나중에 방 터질 떄 다시 undefined로 돌려줘야함
//
//     socket.emit('OfferSubject', {
//       subject: test[socket.room],
//       time: 30000
//     });
//   });
//
//   socket.on('AgreeOrOppose', function(data) {
//     var userroom = socket.room;
//     var userEmail = data.Email;
//
//     if (roomuserinfo[userroom] === undefined) {
//       roomuserinfo[userroom] = {};
//     }
//
//     roomuserinfo[userroom][userEmail] = {
//       Opinion: data.Opinion,
//       Socketid: socket.id
//     };
//
//     var obj_length = Object.keys(roomuserinfo[userroom]).length;
//
//     if (obj_length == 2) //나중에 room의 인원만큼으로 바꾸기
//     {
//       io.sockets.in(socket.room).emit('VoteComplete'); //자신포함 전체 룸안의 유저
//
//       var opiarray = new Array();
//       var y = 0;
//
//       for (var i in roomuserinfo[userroom]) {
//         if (roomuserinfo[userroom][i]['Opinion'] != 'giveup') {
//           opiarray[y] = roomuserinfo[userroom][i]['Opinion'];
//           y++;
//         }
//       }
//
//       if (opiarray.length <= 1) //배열의 크기가 1보다 작거나 같다면 주제 다시 전송
//       {
//         OfferSubject(socket.room);
//         roomuserinfo[userroom] = {};
//         test[socket.room] = undefined;
//       } else {
//         var pass = false;
//         for (var i = 0; i < opiarray.length - 1; i++) {
//           if (opiarray[i] != opiarray[i + 1]) //찬반이 한명이라도 다르면 게임 시작
//           {
//             pass = true;
//             break;
//           }
//         }
//
//         if (pass == true) {
//           console.log("게임시작");
//           io.sockets.in(socket.room).emit('PresentationOrder', {
//             time: 60000,
//             result: roomuserinfo[socket.room],
//             order: "AgreeOpinionComplete",
//             speaking: "agree"
//           });
//           io.sockets.in(socket.room).emit('ServerMessage', {
//             type: "System",
//             data: "text",
//             content: "찬성 측의 간단한 기초 주장 차례입니다.",
//             email: "System",
//             nickname: "System",
//             date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//           });
//         } else {
//           OfferSubject(socket.room);
//           roomuserinfo[userroom] = {};
//           test[socket.room] = undefined;
//         }
//       }
//     }
//   }); //찬성 반대 몰표가 아니라면 게임 시작 몰표라면 주제 재지정
//
//   socket.on('AgreeOpinionComplete', function(data) {
//     console.log("AgreeOpinionComplete");
//     if (test2[socket.room] === undefined) {
//       test2[socket.room] = 0
//     }
//     test2[socket.room]++;
//
//     if (test2[socket.room] == 2) {
//       io.sockets.in(socket.room).emit('PresentationOrder', {
//         time: 60000,
//         result: roomuserinfo[socket.room],
//         order: "OpposeOpinionComplete",
//         speaking: "oppose"
//       });
//       io.sockets.in(socket.room).emit('ServerMessage', {
//         type: "System",
//         data: "text",
//         content: "반대 측의 간단한 기초 주장 차례입니다.",
//         email: "System",
//         nickname: "System",
//         date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//       });
//
//       test2[socket.room] = 0
//     }
//   });
//
//   socket.on('OpposeOpinionComplete', function(data) {
//     console.log("OpposeOpinionComplete");
//
//     test2[socket.room]++;
//
//     if (test2[socket.room] == 2) {
//       io.sockets.in(socket.room).emit('PresentationOrder', {
//         time: 180000,
//         result: roomuserinfo[socket.room],
//         order: "AgreeCounterComplete",
//         speaking: "agree"
//       });
//       io.sockets.in(socket.room).emit('ServerMessage', {
//         type: "System",
//         data: "text",
//         content: "반대 측 의견에 대한 찬성 측 반론을 말해주십시오.",
//         email: "System",
//         nickname: "System",
//         date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//       });
//
//       test2[socket.room] = 0
//     }
//   });
//
//   socket.on('AgreeCounterComplete', function(data) {
//     console.log("AgreeCounterComplete");
//
//     test2[socket.room]++;
//
//     if (test2[socket.room] == 2) {
//       io.sockets.in(socket.room).emit('PresentationOrder', {
//         time: 180000,
//         result: roomuserinfo[socket.room],
//         order: "OpposeCounterComplete",
//         speaking: "oppose"
//       });
//       io.sockets.in(socket.room).emit('ServerMessage', {
//         type: "System",
//         data: "text",
//         content: "찬성 측 의견에 대한 반대 측 반론을 말해주십시오.",
//         email: "System",
//         nickname: "System",
//         date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//       });
//
//       test2[socket.room] = 0
//     }
//   });
//
//   socket.on('OpposeCounterComplete', function(data) {
//     console.log("OpposeCounterComplete");
//
//     test2[socket.room]++;
//
//     if (test2[socket.room] == 2) {
//       io.sockets.in(socket.room).emit('PresentationOrder', {
//         time: 180000,
//         result: roomuserinfo[socket.room],
//         order: "StrategicTimeComplete",
//         speaking: "all"
//       });
//
//       io.sockets.in(socket.room).emit('StrategicTime', {
//         roomuserinfo: roomuserinfo[socket.room]
//       });
//
//       io.sockets.in(socket.room).emit('ServerMessage', {
//         type: "System",
//         data: "text",
//         content: "작전 시간입니다.",
//         email: "System",
//         nickname: "System",
//         date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//       });
//
//       test2[socket.room] = 0
//     }
//   });
//
//   socket.on('StrategicTimeComplete', function(data) {
//     console.log("StrategicTimeComplete");
//
//     test2[socket.room]++;
//
//     if (test2[socket.room] == 2) {
//       io.sockets.in(socket.room).emit('PresentationOrder', {
//         time: 180000,
//         result: roomuserinfo[socket.room],
//         order: "AgreeCounterComplete2",
//         speaking: "agree"
//       });
//       io.sockets.in(socket.room).emit('ServerMessage', {
//         type: "System",
//         data: "text",
//         content: "반대 측 의견에 대한 찬성 측 반론을 말해주십시오.",
//         email: "System",
//         nickname: "System",
//         date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//       });
//
//       test2[socket.room] = 0
//     }
//   });
//
//   socket.on('AgreeCounterComplete2', function(data) {
//     console.log("AgreeCounterComplete2");
//
//     test2[socket.room]++;
//
//     if (test2[socket.room] == 2) {
//       io.sockets.in(socket.room).emit('PresentationOrder', {
//         time: 180000,
//         result: roomuserinfo[socket.room],
//         order: "OpposeCounterComplete2",
//         speaking: "oppose"
//       });
//       io.sockets.in(socket.room).emit('ServerMessage', {
//         type: "System",
//         data: "text",
//         content: "찬성 측 의견에 대한 반대 측 반론을 말해주십시오.",
//         email: "System",
//         nickname: "System",
//         date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//       });
//
//       test2[socket.room] = 0
//     }
//   });
//
//   socket.on('OpposeCounterComplete2', function(data) {
//     console.log("OpposeCounterComplete2");
//
//     test2[socket.room]++;
//
//     if (test2[socket.room] == 2) {
//       io.sockets.in(socket.room).emit('PresentationOrder', {
//         time: 180000,
//         result: roomuserinfo[socket.room],
//         order: "StrategicTimeComplete2",
//         speaking: "all"
//       });
//
//       io.sockets.in(socket.room).emit('StrategicTime', {
//         roomuserinfo: roomuserinfo[socket.room]
//       });
//
//       io.sockets.in(socket.room).emit('ServerMessage', {
//         type: "System",
//         data: "text",
//         content: "작전 시간입니다.",
//         email: "System",
//         nickname: "System",
//         date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//       });
//
//       test2[socket.room] = 0
//     }
//   });
//
//   socket.on('StrategicTimeComplete2', function(data) {
//     console.log("StrategicTimeComplete2");
//
//     test2[socket.room]++;
//
//     if (test2[socket.room] == 2) {
//       io.sockets.in(socket.room).emit('PresentationOrder', {
//         time: 360000,
//         result: roomuserinfo[socket.room],
//         order: "FreeTalkTimeComplete",
//         speaking: "all"
//       });
//
//       io.sockets.in(socket.room).emit('ServerMessage', {
//         type: "System",
//         data: "text",
//         content: "자유 논박 시간입니다.",
//         email: "System",
//         nickname: "System",
//         date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//       });
//
//       test2[socket.room] = 0
//     }
//   });
//
//   socket.on('FreeTalkTimeComplete', function(data) {
//     console.log("FreeTalkTimeComplete");
//
//     test2[socket.room]++;
//
//     if (test2[socket.room] == 2) {
//       io.sockets.in(socket.room).emit('PresentationOrder', {
//         time: 90000,
//         result: roomuserinfo[socket.room],
//         order: "AgreeSummarizeComplete",
//         speaking: "all"
//       });
//
//       io.sockets.in(socket.room).emit('ServerMessage', {
//         type: "System",
//         data: "text",
//         content: "찬성 측의 의견을 요약하여 주십시오.",
//         email: "System",
//         nickname: "System",
//         date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//       });
//
//       test2[socket.room] = 0
//     }
//   });
//
//   socket.on('AgreeSummarizeComplete', function(data) {
//     console.log("AgreeSummarizeComplete");
//
//     test2[socket.room]++;
//
//     if (test2[socket.room] == 2) {
//       io.sockets.in(socket.room).emit('PresentationOrder', {
//         time: 90000,
//         result: roomuserinfo[socket.room],
//         order: "OpposeSummarizeComplete",
//         speaking: "all"
//       });
//
//       io.sockets.in(socket.room).emit('ServerMessage', {
//         type: "System",
//         data: "text",
//         content: "찬성 측의 의견을 요약하여 주십시오.",
//         email: "System",
//         nickname: "System",
//         date: moment().format("YYYY년 MM월 DD일 HH:mm:ss")
//       });
//
//       test2[socket.room] = 0
//     }
//   });
//
//   socket.on('OpposeSummarizeComplete', function(data) {
//     console.log("OpposeSummarizeComplete");
//
//     test2[socket.room]++;
//
//     if (test2[socket.room] == 2) {
//       console.log("게임끝");
//
//       test2[socket.room] = 0
//     }
//   });
//
//   socket.on('leaveRoom', function(data) {
//     socket.leave(socket.room); //룸퇴장
//     socket.room = null;
//     console.log('OUT ROOM LIST', io.sockets.adapter.rooms);
//   });
//
//   socket.on('ClientMessage', function(data) {
//     console.log("데이터 : " + data);
//     data.date = moment().format("YYYY년 MM월 DD일 HH:mm:ss");
//
//     if (data.data == "Strategictext") {
//       if (roomuserinfo[socket.room][data.email]['Opinion'] == "agree") {
//         data.data = "Strategictext_a";
//         for (var i in roomuserinfo[socket.room]) {
//           if (roomuserinfo[socket.room][i]['Opinion'] == "agree") {
//             io.to(roomuserinfo[socket.room][i]['Socketid']).emit('ServerMessage', data);
//           }
//         }
//       } else if (roomuserinfo[socket.room][data.email]['Opinion'] == "oppose") {
//         data.data = "Strategictext_o";
//         for (var i in roomuserinfo[socket.room]) {
//           if (roomuserinfo[socket.room][i]['Opinion'] == "oppose") {
//             io.to(roomuserinfo[socket.room][i]['Socketid']).emit('ServerMessage', data);
//           }
//         }
//       } else {
//         data.data = "Strategictext_g";
//         for (var i in roomuserinfo[socket.room]) {
//           if (roomuserinfo[socket.room][i]['Opinion'] == "giveup") {
//             io.to(roomuserinfo[socket.room][i]['Socketid']).emit('ServerMessage', data);
//           }
//         }
//       }
//     } else {
//       io.sockets.in(socket.room).emit('ServerMessage', data); //자신포함 전체 룸안의 유저
//     }
//   });
//
//   socket.on('ClientMessagevideo', function(data, binarydata) {
//     console.log("데이터 : " + data);
//     data.date = moment().format("YYYY년 MM월 DD일 HH:mm:ss");
//     io.sockets.in(socket.room).emit('ServerVideoMessage', data, binarydata); //자신포함 전체 룸안의 유저
//   });
// });
