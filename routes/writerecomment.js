module.exports = function(app, ReComment) {
  var express = require('express');
  var router = express.Router();
  var bodyParser = require("body-parser");
  var mongoose = require('mongoose');
  const multer = require('multer');
  const path = require('path');
  var Board = require('../model/forums.js');

  app.use(bodyParser.urlencoded({
    extended: false
  }));

  const upload = multer({
    storage: multer.diskStorage({
      destination: function(req, file, cb) {
        cb(null, 'comments/');
      },
      filename: function(req, file, cb) {
        var email = req.body.Email;

        email = email.replace(/\"/gi, "");
        cb(null, Date.now() + "_" + email + path.extname(file.originalname));
      }
    }),
  });

  router.post('/', upload.single('upload'), (req, res) => {
    var RC_Email = req.body.Email;
    var RC_Nickname = req.body.Nickname;
    var RC_IsImage = req.body.IsImage;
    var RC_Content = req.body.Content;

    var F_idx = req.body.ForumIdx;
    var RC_commentuid = req.body.CommentUid;

    RC_Email = RC_Email.replace(/\"/gi, "");
    RC_Nickname = RC_Nickname.replace(/\"/gi, "");
    RC_Content = RC_Content.replace(/\"/gi, "");
    RC_commentuid = RC_commentuid.replace(/\"/gi, "");

    var recomment = new ReComment();
    recomment.Email = RC_Email;
    recomment.recomment_Content = RC_Content;
    recomment.Nickname = RC_Nickname;
    recomment.IsImage = RC_IsImage;
    recomment.commentUid = RC_commentuid;

    if (RC_IsImage == "true") {
      recomment.recomment_Imagepath = req.file.path;
    }

    Board.findOneAndUpdate({
      "idx": F_idx,
      "Comments._id": RC_commentuid
    },{ $push: { ReComments : recomment}}, {
      upsert: true
    }, function(err, forum) {
      if (err) {
        console.log("comment에러 : " + err);
        res.json({
          type: false,
          data: err
        });
      } else if (!forum) {
        console.log("forum이 없음");
        res.json({
          type: false,
          data: "empty forum"
        });
      } else {
        console.log("recomment성공");
        res.json({
          type: true,
        });
      }
    });
  });

  return router; //라우터를 리턴
}
