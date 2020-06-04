const express = require('express');
const Forum = require('../model/forum');
const User = require('../model/user');
const Comment = require('../model/comment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, 'forumImages/');
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  })
});

//글 목록 보기
router.get('/', (req, res) => {
  if (req.query.best == "true") {
    if (req.query.search == "true") {
      if (req.query.kind == "제목") {
        Forum.find({
            $and: [{
                'recommend.0': {
                  $exists: true
                }
              },
              {
                'title': {
                  $regex: req.query.keyword
                }
              }
            ]
          }).select({
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
          }).skip((req.query.page - 1) * 10).limit(10).then((forums) => {
            if (forums) {
              res.sendStatus(200).send(forums);
            } else {
              res.sendStatus(401); //없으면 401
            }
          })
          .catch((err) => {
            console.log("에러 : " + err);
            res.sendStatus(500);
          })
      }

      if (req.query.kind == "내용") {
        Forum.find({
            $and: [{
                'recommend.0': {
                  $exists: true
                }
              },
              {
                'content': {
                  $regex: req.query.keyword
                }
              }
            ]
          }).select({
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
          }).skip((req.query.page - 1) * 10).limit(10).then((forums) => {
            if (forums) {
              res.sendStatus(200).send(forums);
            } else {
              res.sendStatus(401); //없으면 401
            }
          })
          .catch((err) => {
            console.log("에러 : " + err);
            res.sendStatus(500);
          })
      }

      if (req.query.kind == "제목+내용") {
        Forum.find({
            $and: [{
                'recommend.0': {
                  $exists: true
                }
              },
              {
                $or: [{
                    'title': {
                      $regex: req.query.keyword
                    }
                  },
                  {
                    'content': {
                      $regex: req.query.keyword
                    }
                  }
                ]
              }
            ]
          }).select({
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
          }).skip((req.query.page - 1) * 10).limit(10).then((forums) => {
            if (forums) {
              res.sendStatus(200).send(forums);
            } else {
              res.sendStatus(401); //없으면 401
            }
          })
          .catch((err) => {
            console.log("에러 : " + err);
            res.sendStatus(500);
          })
      }
    } else {
      Forum.find({
          'recommend.0': {
            $exists: true
          }
        }).select({
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
        }).skip((req.query.page - 1) * 10).limit(10).then((forums) => {
          if (forums) {
            res.send(forums);
          } else {
            res.sendStatus(401).send(false); //없으면 401
          }
        })
        .catch((err) => {
          console.log("에러 : " + err);
          res.sendStatus(500).send(false);
        })
    }
  } else {
    if (req.query.search == "true") {
      if (req.query.kind == "제목") {
        Forum.find({
            'title': {
              $regex: req.query.keyword
            }
          }).select({
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
          }).skip((req.query.page - 1) * 10).limit(10).then((forums) => {
            if (forums) {
              res.send(forums);
            } else {
              res.sendStatus(401).send(false); //없으면 401
            }
          })
          .catch((err) => {
            console.log("에러 : " + err);
            res.sendStatus(500).send(false);
          })
      }

      if (req.query.kind == "내용") {
        Forum.find({
            'content': {
              $regex: req.query.keyword
            }
          }).select({
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
          }).skip((req.query.page - 1) * 10).limit(10).then((forums) => {
            if (forums) {
              res.send(forums);
            } else {
              res.sendStatus(401).send(false); //없으면 401
            }
          })
          .catch((err) => {
            console.log("에러 : " + err);
            res.sendStatus(500).send(false);
          })
      }

      if (req.query.kind == "제목+내용") {
        Forum.find({
            $or: [{
                'title': {
                  $regex: req.query.keyword
                }
              },
              {
                'content': {
                  $regex: req.query.keyword
                }
              }
            ]
          }).select({
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
          }).skip((req.query.page - 1) * 10).limit(10).then((forums) => {
            if (forums) {
              res.send(forums);
            } else {
              res.sendStatus(401).send(false); //없으면 401
            }
          })
          .catch((err) => {
            console.log("에러 : " + err);
            res.sendStatus(500).send(false);
          })
      }
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
        }).skip((req.query.page - 1) * 10).limit(10).then((forums) => {
          if (forums) {
            res.send(forums);
          } else {
            res.sendStatus(401).send(false); //없으면 401
          }
        })
        .catch((err) => {
          console.log("에러 : " + err);
          res.sendStatus(500).send(false);
        })
    }
  }
});

//글 자세히 보기
router.get('/:idx', (req, res) => {
  Forum.findOneById(req.params.idx).populate({
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
        res.status(200).send(forum);
      } else {
        res.sendStatus(401);
      }
    })
    .catch((err) => {
      console.log("에러 : " + err);
      res.sendStatus(500);
    })
});

//글 작성
router.post('/', upload.array('img', 5), (req, res) => {
  var imageUrl = new Array();
  for (var i = 0; i < req.files.length; i++) {
    imageUrl[i] = req.files[i].path;
  }

  req.body.imageUrl = imageUrl;

  Forum.create(req.body)
    .then(forum => {
      User.findOneAndUpdate({
          _id: req.body.user
        }, {
          $push: {
            forums: forum.idx
          }
        })
        .then((user) => {
          res.sendStatus(200);
        })
        .catch((err) => {
          console.log("에러 : " + err);
          res.sendStatus(500);
        })
    })
    .catch((err) => {
      console.log("에러 : " + err);
      res.sendStatus(500);
    })
});

//글 삭제
router.delete('/:idx', (req, res) => {
  Forum.find({
      idx: req.params.idx
    })
    .deleteOne()
    .then((result) => {
      Comment.find({
          forumIdx: req.params.idx
        })
        .deleteOne()
        .then((result2) => {
          res.sendStatus(200);
          // User.findOneAndUpdate({
          //     _id: req.body.user
          //   }, {
          //     $pull: {
          //       recommend: req.body.user
          //     }
          //   }).then(user => {
          //     res.send({
          //       type: true,
          //       data: "삭제 완료"
          //     })
          //   })
          //   .catch(err => res.sendStatus(500));
        }).catch((err) => {
          console.log("에러 : " + err);
          res.sendStatus(500);
        });
    })
    .catch((err) => {
      console.log("에러 : " + err);
      res.sendStatus(500);
    });
});

//글 수정
router.patch('/:idx', upload.array('img', 5), (req, res) => {
  var filePathArray = new Array();
  var imageUrl = new Array();

  if (req.body.imageUrl) {
    var bodyPathArray = req.body.imageUrl

    for (var i = 0; i < req.files.length; i++) {
      filePathArray[i] = req.files[i].path;
    }

    imageUrl = bodyPathArray.concat(filePathArray);
  } else {
    for (var i = 0; i < req.files.length; i++) {
      imageUrl[i] = req.files[i].path;
    }
  }

  Forum.findOneAndUpdate({
      idx: req.params.idx,
      user: req.body.user
    }, {
      $set: {
        title: req.body.title,
        content: req.body.content,
        subject: req.body.subject,
        imageUrl: imageUrl
      }
    }).then(forum => {
      var array = forum.imageUrl;

      for (var i = 0; i < array.length; i++) {
        if (!imageUrl.includes(array[i])) //imageUrl 배열이 array[i]의 값을 포함하지 않으면 파일 제거
        {
          fs.unlink(array[i], function(err) {
            if (err) throw err;
            console.log('file deleted');
          });
        }
      }
      res.sendStatus(200);
    })
    .catch(err => res.sendStatus(500));
});

//댓글 작성
router.post('/:idx/comments', upload.single('img'), (req, res) => {

  req.body.forumIdx = req.params.idx;

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
          res.sendStatus(401);
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
                          res.sendStatus(200);
                        })
                        .catch((err) => {
                          console.log("유저 코멘트id 등록 에러 : " + err);
                          res.sendStatus(500);
                        })
                    })
                    .catch((err) => {
                      console.log("포럼 코멘트id 등록 에러 : " + err);
                      res.sendStatus(500);
                    })
                })
                .catch((err) => {
                  console.log("reply 코멘트 등록 에러 : " + err);
                  res.sendStatus(500);
                })
            })
            .catch((err) => {
              console.log("코멘트 등록 에러 : " + err);
              res.sendStatus(500);
            })
        }
      }).catch(err => {
        res.sendStatus(500);
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
                res.sendStatus(200);
              })
              .catch((err) => {
                console.log("유저 코멘트id 등록 에러 : " + err);
                res.sendStatus(500);
              })
          })
          .catch((err) => {
            console.log("포럼 코멘트id 등록 에러 : " + err);
            res.sendStatus(500);
          })
      }).catch((err) => {
        console.log("코멘트 등록 에러 : " + err);
        res.sendStatus(500);
      })
  }
});

//댓글 삭제
router.delete('/:idx/comments/:id', (req, res) => {
  console.log("댓글삭제");
  Forum.findOneAndUpdate({
      idx: req.params.idx
    }, {
      $pull: {
        comments: req.params.id
      }
    }).then(forum => {
      Comment.deleteOne({
        _id: req.params.id
      }).then(comment => {
        res.sendStatus(200)
      }).catch(err => res.sendStatus(500))
    })
    .catch(err => res.sendStatus(500));
});

router.post('/modifyComment', (req, res) => {
  console.log("modifyComment : " + JSON.stringify(req.body));

});

//추천
router.post('/:idx/recommend', (req, res) => {

  if (req.body.type == "true") //추천취소
  {
    console.log("취소")
    Forum.findOneAndUpdate({
        idx: req.params.idx
      }, {
        $pull: {
          recommend: req.body.user
        }
      }).then(forum => {
        res.sendStatus(200);
      })
      .catch(err => res.sendStatus(500));
  } else { //추천하기
    Forum.findOneAndUpdate({
        idx: req.params.idx
      }, {
        $addToSet: {
          recommend: req.body.user
        }
      }).then(forum => {
        res.sendStatus(200);
      })
      .catch(err => res.sendStatus(500));
  }
});

module.exports = router;
