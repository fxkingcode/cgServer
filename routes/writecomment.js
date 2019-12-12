module.exports = function(app, Comment) {
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

  const upload = multer(
    {
      storage: multer.diskStorage({
          destination: function (req, file, cb) {
          cb(null, 'comments/');
          },
          filename: function (req, file, cb) {
            var email = req.body.Email;

            email = email.replace(/\"/gi, "");
            cb(null, Date.now() + "_" + email + path.extname(file.originalname));
          }
      }),
    });

  router.post('/', upload.single('upload'), (req, res) => {
    var C_Email = req.body.Email;
    var C_Nickname = req.body.Nickname;
    var C_IsImage = req.body.IsImage;
    var C_Content = req.body.Content;

    var F_idx = req.body.ForumIdx;

    console.log("req.body : " + JSON.stringify(req.body));

    C_Email = C_Email.replace(/\"/gi, "");
    C_Nickname = C_Nickname.replace(/\"/gi, "");
    C_Content = C_Content.replace(/\"/gi, "");

    var comment = new Comment();
    comment.Email = C_Email;
    comment.comment_Content = C_Content;
    comment.Nickname = C_Nickname;
    comment.IsImage = C_IsImage;

    if(C_IsImage == "true")
    {
      comment.comment_Imagepath = req.file.path;
    }

    Board.findOneAndUpdate({idx : F_idx}, { $push: { Comments : comment}}, {upsert:true}, function (err, forum) {
      if(err){
          console.log("comment에러 : "+ err);
          res.json({
            type:false,
            data:err
          });
      }
      else {
        console.log("comment성공");
        res.json({
          type:true,
        });
      }
    });
  });

  return router; //라우터를 리턴
}
