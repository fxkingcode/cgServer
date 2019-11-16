module.exports = function(app, User) {
  var express = require('express');
  var bodyParser = require("body-parser");
  var mongoose = require('mongoose');
  var router = express.Router();

  app.use(bodyParser.urlencoded({
    extended: false
  }));

  router.post('/', (req, res) => {

    var inputData;
    inputData = req.body;
    console.log("데이터 : ", inputData);
    console.log("Email : ", inputData.Email);
    console.log("Password : ", inputData.Password);
    console.log("Nickname : ", inputData.Nickname);
    console.log("PhoneNum : ", inputData.PhoneNum);

    var usersSchema = new User();

    usersSchema.Email = inputData.Email;
    usersSchema.Password = inputData.Password;
    usersSchema.Nickname = inputData.Nickname;
    usersSchema.PhoneNum = inputData.PhoneNum;
    usersSchema.signupDate = new Date;

    var findConditionLocalUser = {
       Email: inputData.Email,
       Nickname: inputData.Nickname
    }

    var usersDB = mongoose.model('user');

    usersDB.findOne(findConditionLocalUser)
        .exec(function (err, user) {
            if (err){
                res.json({
                    type: false,
                    data: "Error occured " + err
                });
            } else if (user) {
                res.json({
                    type: false,
                    data: "Email or Nickname already exists"
                });
            } else if(!user) {

              usersSchema.save(function(err, newUser) {
                if (err) {
                  console.error(err);
                  return;
                }

                console.log("Data received successfully");

                res.json({
                    type: true,
                    data: "Success signUp!"
                });
              });

            }
        })
  });

  return router; //라우터를 리턴
}
