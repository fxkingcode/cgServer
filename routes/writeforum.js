module.exports = function(app, Forum) {
  var express = require('express');
  var router = express.Router();
  var bodyParser = require("body-parser");
  var mongoose = require('mongoose');
  const multer = require('multer');
  const path = require('path');

  app.use(bodyParser.urlencoded({
    extended: false
  }));

  // const fileFilter = function(req,file,cb)
  // {
  //   if(file == null)
  //   {
  //     console.log("파일 빔 : " + file);
  //     cb(null, false);
  //   }
  //   else {
  //     console.log("파일 안빔 : " + file);
  //     cb(null, true);
  //   }
  // }

  const upload = multer(
    {
      storage: multer.diskStorage({
          destination: function (req, file, cb) {
          cb(null, 'forums/');
          },
          filename: function (req, file, cb) {
            var email = req.body.Email;

            email = email.replace(/\"/gi, "");
            cb(null, Date.now() + "_" + email + path.extname(file.originalname));
          }
      }),
    });

  router.post('/', upload.array('upload'), (req, res) => {
    var F_Email = req.body.Email;
    var F_Nickname = req.body.Nickname;
    var F_Title = req.body.Title;
    var F_Subject = req.body.Subject;
    var F_Content = req.body.Content;

    F_Email = F_Email.replace(/\"/gi, "");
    F_Title = F_Title.replace(/\"/gi, "");
    F_Subject = F_Subject.replace(/\"/gi, "");
    F_Content = F_Content.replace(/\"/gi, "");
    F_Nickname = F_Nickname.replace(/\"/gi, "");

    var newforum = new Forum();
    newforum.Email = F_Email;
    newforum.Nickname = F_Nickname;
    newforum.Title = F_Title;
    newforum.Subject = F_Subject;
    newforum.Content = F_Content;
    newforum.Recommend = 0;
    newforum.ImageNum = req.body.ImageNum;

    if(req.body.ImageNum == 1)
    {
      newforum.Image0path = req.files[0].path
    }
    else if(req.body.ImageNum == 2)
    {
      newforum.Image0path = req.files[0].path
      newforum.Image1path = req.files[1].path
    }
    else if(req.body.ImageNum == 3)
    {
      newforum.Image0path = req.files[0].path
      newforum.Image1path = req.files[1].path
      newforum.Image2path = req.files[2].path
    }
    else if(req.body.ImageNum == 4)
    {
      newforum.Image0path = req.files[0].path
      newforum.Image1path = req.files[1].path
      newforum.Image2path = req.files[2].path
      newforum.Image3path = req.files[3].path
    }
    else if(req.body.ImageNum == 5)
    {
      newforum.Image0path = req.files[0].path
      newforum.Image1path = req.files[1].path
      newforum.Image2path = req.files[2].path
      newforum.Image3path = req.files[3].path
      newforum.Image4path = req.files[4].path
    }


    newforum.save(function(err,forum){
        if(err){
            console.log("newForum에러 : "+ err);
            res.json({
              type:false,
              data:err
            });
        }
        else {
          console.log("newForum성공 : ");
          res.json({
            type:true
          });
        }
    });
  });

  return router; //라우터를 리턴
}
