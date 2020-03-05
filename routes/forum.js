const express = require('express');
const Forum = require('../model/forum');
const User = require('../model/user');
const Comment = require('../model/comment');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, 'forumImages/');
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  }),
});

router.post('/recommendForum', (req, res) => {
  console.log("recommendForum : " + JSON.stringify(req.body));

  if(req.body.type == "true")//추천취소
  {
    console.log("취소")
    Forum.findOneAndUpdate({
      idx: req.body.idx
    }, {
      $pull: {
        recommend: req.body.user
      }
    }).then(forum => {
      res.send({
        type:true,
        data:"추천 취소 완료"
      })
    })
    .catch(err => res.status(500).send({
      type:false,
      data:err
    }));
  }else {//추천하기
    Forum.findOneAndUpdate({
      idx: req.body.idx
    }, {
      $addToSet: {
        recommend: req.body.user
      }
    }).then(forum => {
      res.send({
        type:true,
        data:"추천 완료"
      })
    })
    .catch(err => res.status(500).send({
      type:false,
      data:err
    }));
  }
});

//댓글 작성
router.post('/writeComment', upload.single('img'), (req, res) => {
  console.log("writeComment : " + JSON.stringify(req.body));

  if (req.file) {
    req.body.imageUrl = req.file.path;
  }

  if (req.body.replyCommentId) {
    Forum.findOne()
      .where('idx').equals(req.body.forumIdx)
      .select('comments')
      .then(forumComments => {

        var array = forumComments.comments
        var position = array.findIndex((item, idx) => {
          return item == req.body.replyCommentId;
        });

        if (position == -1) {
          console.log("해당 댓글을 찾을 수 없습니다.");
          res.status(401).send({
            type: false,
            data: "해당 댓글을 찾을 수 없습니다. 에러 : " + err
          });
        } else {
          position++;

          Comment.create(req.body)
            .then(comment => {
              Comment.findOneAndUpdate({
                  _id: req.body.replyCommentId
                }, {
                  $push: {
                    replies: comment._id
                  }
                }).then(replyComment => {
                  var rep = replyComment.replies;

                  Forum.findOneAndUpdate({
                      idx: req.body.forumIdx
                    }, {
                      $push: {
                        comments: {
                          $each: [comment._id],
                          $position: position + rep.length
                        }
                      }
                    }).then((forum) => {
                      User.findOneAndUpdate({
                          _id: req.body.user
                        }, {
                          $addToSet: {
                            comments: req.body.forumIdx
                          }
                        })
                        .then((user) => {
                          res.send({
                            type: true,
                            data: "완료"
                          })
                        })
                        .catch((err) => {
                          console.log("유저 코멘트id 등록 에러 : " + err);
                          res.status(500).send({
                            type: false,
                            data: "유저 코멘트id 등록 실패 : " + err
                          })
                        })
                    })
                    .catch((err) => {
                      console.log("포럼 코멘트id 등록 에러 : " + err);
                      res.status(500).send({
                        type: false,
                        data: "포럼 코멘트id 등록 실패 : " + err
                      })
                    })
                })
                .catch((err) => {
                  console.log("reply 코멘트 등록 에러 : " + err);
                  res.status(500).send({
                    type: false,
                    data: "reply 코멘트id 등록 실패 : " + err
                  })
                })
            })
            .catch((err) => {
              console.log("코멘트 등록 에러 : " + err);
              res.status(500).send({
                type: false,
                data: "코멘트 등록 실패 : " + err
              })
            })
        }
      }).catch(err => {
        res.status(500).send({
          type: false,
          data: "포럼 comments select 에러 : " + err
        });
      })
  } else {
    Comment.create(req.body)
      .then(comment => {
        Forum.findOneAndUpdate({
            idx: req.body.forumIdx
          }, {
            $push: {
              comments: comment._id
            }
          })
          .then((forum) => {
            User.findOneAndUpdate({
                _id: req.body.user
              }, {
                $addToSet: {
                  comments: req.body.forumIdx
                }
              })
              .then((user) => {
                res.send({
                  type: true,
                  data: "완료"
                })
              })
              .catch((err) => {
                console.log("유저 코멘트id 등록 에러 : " + err);
                res.status(500).send({
                  type: false,
                  data: "유저 코멘트id 등록 실패 : " + err
                })
              })
          })
          .catch((err) => {
            console.log("포럼 코멘트id 등록 에러 : " + err);
            res.status(500).send({
              type: false,
              data: "포럼 코멘트id 등록 실패 : " + err
            })
          })
      }).catch((err) => {
        console.log("코멘트 등록 에러 : " + err);
        res.status(500).send({
          type: false,
          data: "코멘트 등록 실패 : " + err
        })
      })
  }
});

//글 작성
router.post('/writeForum', upload.array('img', 5), (req, res) => {
  console.log("writeForum : " + JSON.stringify(req.body));

  var imageUrl = new Array();
  for (var i = 0; i < req.files.length; i++) {
    console.log("실행")
    imageUrl[i] = req.files[i].path;
  }

  req.body.imageUrl = imageUrl;


  Forum.create(req.body)
    .then(forum => {
      console.log("forum : " + JSON.stringify(forum));
      User.findOneAndUpdate({
          _id: req.body.user
        }, {
          $push: {
            forums: forum.idx
          }
        })
        .then((user) => {
          res.send({
            type: true,
            data: "완료"
          })
        })
        .catch((err) => {
          console.log("에러 : " + err);
          res.status(500).send({
            type: false,
            data: "유저 포럼id 등록 실패 : " + err
          })
        })
    })
    .catch((err) => {
      console.log("에러 : " + err);
      res.status(500).send({
        type: false,
        data: "포럼 등록 실패 : " + err
      });
    })
});

// ,
// populate: {
//   path: 'replies',
//   model: 'Comment',
//   populate: {
//     path: 'user',
//     model: 'User',
//     select: {
//       'nickname': 1,
//       'profile': 1
//     }
//   }
// }

//글 자세히 보기
router.post('/detailForum', (req, res) => {
  Forum.findOneById(req.body.idx).populate({
      path: 'comments',
      model: 'Comment',
      populate: {
        path: 'user',
        model: 'User',
        select: {
          'nickname': 1,
          'profile': 1
        }
      }
    })
    .populate({
      path: 'user',
      model: 'User',
      select: {
        'nickname': 1,
        'profile': 1
      }
    }).then((forum) => {
      if (forum) {
        console.log(forum);
        res.send(forum);
      } else {
        res.status(401).send("401 error")
      }
    })
    .catch((err) => {
      console.log("에러 : " + err);
      res.status(500).send(err)
    })
});



router.post('/callForums', (req, res) => {

  if (req.body.isBestForum == "true") {
    Forum.find({'recommend.0': {$exists: true}}).select({
        'title': 1,
        'comments': 1,
        'subject': 1,
        'imageUrl': 1,
        'birth': 1,
        'recommend': 1,
        'user': 1,
        'idx': 1
      })
      .populate({
        path: 'user',
        model: 'User',
        select: {
          'nickname': 1,
          'profile': 1
        }
      }).sort({
        "idx": -1
      }).skip((req.body.page - 1) * 10).limit(10).then((forums) => {
        if (forums) {
          res.send(forums);
        } else {
          res.status(401).send(false); //없으면 401
        }
      })
      .catch((err) => {
        console.log("에러 : " + err);
        res.status(500).send(false);
      })
  } else {
    Forum.find().select({
        'title': 1,
        'comments': 1,
        'subject': 1,
        'imageUrl': 1,
        'birth': 1,
        'recommend': 1,
        'user': 1,
        'idx': 1
      }).populate({
        path: 'user',
        model: 'User',
        select: {
          'nickname': 1,
          'profile': 1
        }
      }).sort({
        "idx": -1
      }).skip((req.body.page - 1) * 10).limit(10).then((forums) => {
        if (forums) {
          res.send(forums);
        } else {
          res.status(401).send(false); //없으면 401
        }
      })
      .catch((err) => {
        console.log("에러 : " + err);
        res.status(500).send(false);
      })
  }
});

module.exports = router;
