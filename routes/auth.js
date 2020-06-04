const express = require('express');
const User = require('../model/user');

const router = express.Router();

router.get('/email', (req, res) => {
  User.findOneByEmail(req.query.email)
    .then((user) => {
      if (!user) {
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    })
    .catch(err => res.sendStatus(500));
});

//닉네임 중복확인
router.get('/nickname', (req, res) => {
  User.findOneByNickname(req.query.nickname)
    .then((user) => {
      if (!user) {
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    })
    .catch(err => res.sendStatus(500));
});

//로그인
router.post('/login', (req, res) => {
  User.findOneByEmailAndPassword(req.body.email, req.body.password)
    .then((user) => {
      if (user) {
        res.status(200).send(user);
      } else {
        res.sendStatus(401); //없으면 401
      }
    })
    .catch(err => res.sendStatus(500));
});

module.exports = router;
