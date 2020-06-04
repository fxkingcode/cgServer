const express = require('express');
const User = require('../model/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, 'profileImages/');
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  })
});

//유저보기
router.get('/:email', (req, res) => {
  User.findOne()
    .where('email').equals(req.params.email)
    .then(user => {
      res.status(200).send(user);
    }).catch(err => {
      res.sendStatus(500)
    });
});

//회원가입
router.post('/', (req, res) => {
  User.create(req.body)
    .then(user => res.sendStatus(200))
    .catch(err => res.sendStatus(500));
});

//유저 수정
router.patch('/:email', upload.single('img'), (req, res) => {
  var profile;

  if (req.body.profile) {
    profile = req.body.profile;
  } else if (req.file) {
    profile = req.file.path;
  } else {
    profile = null;
  }

  if (profile == null) {
    User.findOneAndUpdate({
        email: req.params.email
      }, {
        $set: {
          introduce: req.body.introduce
        },
        $unset: {
          profile: 1
        }
      }).then(user => {
        if (user.profile) {
          fs.unlink(user.profile, function(err) {
            if (err) throw err;
            console.log('file deleted');
            res.sendStatus(200);
          });
        }
      })
      .catch(err => res.sendStatus(500));
  } else {
    User.findOneAndUpdate({
        email: req.params.email
      }, {
        $set: {
          introduce: req.body.introduce,
          profile: profile
        }
      }).then(user => {
        if (user.profile) {
          if (profile != user.profile) {
            fs.unlink(user.profile, function(err) {
              if (err) throw err;
              console.log('file deleted');
              res.sendStatus(200);
            });
          }
        }
      })
      .catch(err => res.sendStatus(500));
  }
});

module.exports = router;
