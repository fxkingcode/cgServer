module.exports = function(app, User) {
  var express = require('express');
  var router = express.Router();
  var bodyParser = require("body-parser");
  var mongoose = require('mongoose');
  const multer = require('multer');
  const path = require('path');

  app.use(bodyParser.urlencoded({
    extended: false
  }));

const upload = multer(
  {
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
        cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
          var email = req.body.Email;
          email = email.replace(/\"/gi, "");
          cb(null, email + "_profile.jpg");
          req.Email = email;
        }
    }),
  });

  router.post('/', upload.single('upload'), (req, res) => {
    var usersDB = mongoose.model('user');
    console.log("req.Email : " + req.Email);

    usersDB.findOneAndUpdate({ Email: req.Email}, {$set: { Profile: req.file.path }}, {upsert:true}, function(err, doc){
      if(err)
      {
        console.log("에러 : " + err);
        res.json({
            type: false,
            data: "Error occured " + err
        });
        return
      }
      console.log("성공");
      res.json({
          type: true,
          data: req.file.path
      });
    });
  });

  return router; //라우터를 리턴
}
