module.exports = function(app, User) {
  var jwt = require('jsonwebtoken');
  var mongoose = require('mongoose');
  var jwtSecret = 'secret';
  var express = require('express');
  var bodyParser = require("body-parser");

  var router = express.Router();

  app.use(bodyParser.urlencoded({
    extended: false
  }));

  router.post('/', (req, res) => {

    var usersSchema = new User();

    var inputData;
    inputData = req.body;
    console.log("데이터 : ", inputData);
    console.log("Email : ", inputData.Email);
    console.log("Password : ", inputData.Password);

    var email = inputData.Email;
    var password = inputData.Password;

    var findConditionLocalUser = {
      Email: inputData.Email,
      Password: inputData.Password
    }

    var usersDB = mongoose.model('user');

    usersDB.findOne(findConditionLocalUser)
      .exec(function(err, user) {
        if (err) {
          res.json({
            type: false,
            data: "Error occured " + err
          });
        } else if (!user) {
          res.json({
            type: false,
            data: "Incorrect email/password"
          });
        } else if (user) {
          jwt.sign({
            Email: user.Email,
            Nickname: user.Nickname
          }, jwtSecret, {
            subject: "chatground",
            expiresIn: '60m',
            issuer: "yeonjun"
          }, (err, token) => {
            if (err) {
              console.log("토큰 생성 에러 : ", err);
            } else if (token) {
              console.log("토큰 생성 : ", token);
              res.json({
                type: true,
                data: "Success",
                token: token,
                userEmail: user.Email,
                userNickname: user.Nickname
              });
            }
          })
        }
      });
  });

  return router; //라우터를 리턴
}
