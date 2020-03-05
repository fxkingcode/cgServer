const express = require('express');
const User = require('../model/user');

const router = express.Router();

//이메일 중복확인
router.post('/emailOverlap', (req, res) => {
  console.log("email" + JSON.stringify(req.body));

  User.findOneByEmail(req.body.email)
    .then((user) => {
      if (!user) {
        res.send({
          type:true,
          data:"사용 가능한 이메일입니다"
        })
      }else {
        res.send({
          type:false,
          data:"이미 존재하는 이메일입니다"
        })
      }
    })
    .catch(err => res.status(500).send({
      type:false,
      data:err
    }));
});

//이메일 중복확인
router.post('/nicknameOverlap', (req, res) => {
  console.log("nickname" + JSON.stringify(req.body));

  User.findOneByNickname(req.body.nickname)
    .then((user) => {
      if (!user) {
        res.send({
          type:true,
          data:"사용 가능한 닉네임입니다"
        })
      }else {
        res.send({
          type:false,
          data:"이미 존재하는 닉네임입니다"
        })
      }
    })
    .catch(err => res.status(500).send({
      type:false,
      data:err
    }));
});

//회원가입
router.post('/signIn', (req, res) => {
  console.log("signIn" + JSON.stringify(req.body));

  User.findOneByEmailAndPassword(req.body.email,req.body.password)
  .then((user) => {
    if (user) {
      res.send(user);
    }else {
      res.status(401).send(false);//없으면 401
    }
  })
  .catch(err => res.status(500).send(err));
});

//회원가입
router.post('/signUp', (req, res) => {
  console.log("signUp" + JSON.stringify(req.body));

  User.create(req.body)
  .then(user => res.send(user))
  .catch(err => res.status(500).send(err));
});

module.exports = router;
