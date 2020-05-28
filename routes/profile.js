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

router.post('/callProfile', (req, res) => {
  console.log("callProfile : " + JSON.stringify(req.body));

  User.findOne()
    .where('_id').equals(req.body.user)
    .then(modifiedUser => {
      res.send(modifiedUser);
    }).catch(err => {
      res.status(500)
    });
});

router.post('/modifyProfile', upload.single('img'), (req, res) => {
  console.log("modifyProfile : " + JSON.stringify(req.body));

  var profile;

  if (req.body.profile) {
    profile = req.body.profile;
  } else if (req.file) {
    profile = req.file.path;
  }else {
    profile = null;
  }

  if(profile == null){
    User.findOneAndUpdate({
        _id: req.body.user
      }, {
        $set: {
          introduce: req.body.introduce
        },
        $unset:{
          profile:1
        }
      }).then(user => {
        if (user.profile) {
          fs.unlink(user.profile, function(err) {
            if (err) throw err;
            console.log('file deleted');
          });
        }
        User.findOne()
          .where('_id').equals(req.body.user)
          .then(modifiedUser => {
            res.send(modifiedUser);
          }).catch(err => {
            res.status(500)
          });
      })
      .catch(err => res.status(500));
  }else{User.findOneAndUpdate({
      _id: req.body.user
    }, {
      $set: {
        introduce: req.body.introduce,
        profile: profile
      }
    }).then(user => {
      if(user.profile){
        if (profile != user.profile) {
          fs.unlink(user.profile, function(err) {
            if (err) throw err;
            console.log('file deleted');
          });
        }
      }
      User.findOne()
        .where('_id').equals(req.body.user)
        .then(modifiedUser => {
          res.send(modifiedUser);
        }).catch(err => {
          res.status(500)
        });
    })
    .catch(err => res.status(500));}
});

module.exports = router;
