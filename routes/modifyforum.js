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

  const upload = multer({
    storage: multer.diskStorage({
      destination: function(req, file, cb) {
        cb(null, 'forums/');
      },
      filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
      }
    }),
  });

  router.post('/', upload.array('upload'), (req, res) => {
    console.log("데이터 : " + JSON.stringify(req.body));
    var F_idx = req.body.idx;
    var F_Title = req.body.Title;
    var F_Subject = req.body.Subject;
    var F_Content = req.body.Content;
    var F_ImageNum = req.body.ImageNum;
    var F_part1 = req.body.part1;
    var F_part2 = req.body.part2;
    var F_part3 = req.body.part3;
    var F_part4 = req.body.part4;
    var F_part5 = req.body.part5;

    if(typeof F_part1 !== 'undefined')
    {
      F_part1 = F_part1.replace(/\"/gi, "");
    }
    if(typeof F_part2 !== 'undefined')
    {
      F_part2 = F_part2.replace(/\"/gi, "");
    }
    if(typeof F_part3 !== 'undefined')
    {
      F_part3 = F_part3.replace(/\"/gi, "");
    }
    if(typeof F_part4 !== 'undefined')
    {
      F_part4 = F_part4.replace(/\"/gi, "");
    }
    if(typeof F_part5 !== 'undefined')
    {
      F_part5 = F_part5.replace(/\"/gi, "");
    }

    if(F_ImageNum == 1)
    {
      if(typeof F_part1 === 'undefined')
      {
        F_part1 = req.files[0].path;
      }
      F_part2 = null;
      F_part3 = null;
      F_part4 = null;
      F_part5 = null;
    }

    if(F_ImageNum == 2)
    {
      if(typeof F_part1 === 'undefined')
      {
        F_part1 = req.files[0].path;
        F_part2 = req.files[1].path;
      }
      else if(typeof F_part2 === 'undefined')
      {
        F_part2 = req.files[0].path;
      }

      F_part3 = null;
      F_part4 = null;
      F_part5 = null;
    }

    if(F_ImageNum == 3)
    {
      if(typeof F_part1 === 'undefined')
      {
        F_part1 = req.files[0].path;
        F_part2 = req.files[1].path;
        F_part3 = req.files[2].path;
      }
      else if(typeof F_part2 === 'undefined')
      {
        F_part2 = req.files[0].path;
        F_part3 = req.files[1].path;
      }
      else if(typeof F_part3 === 'undefined')
      {
        F_part3 = req.files[0].path;
      }

      F_part4 = null;
      F_part5 = null;
    }

    if(F_ImageNum == 4)
    {
      if(typeof F_part1 === 'undefined')
      {
        F_part1 = req.files[0].path;
        F_part2 = req.files[1].path;
        F_part3 = req.files[2].path;
        F_part4 = req.files[3].path;
      }
      else if(typeof F_part2 === 'undefined')
      {
        F_part2 = req.files[0].path;
        F_part3 = req.files[1].path;
        F_part4 = req.files[2].path;
      }
      else if(typeof F_part3 === 'undefined')
      {
        F_part3 = req.files[0].path;
        F_part4 = req.files[1].path;
      }
      else if(typeof F_part4 === 'undefined')
      {
        F_part4 = req.files[0].path;
      }

      F_part5 = null;
    }

    if(F_ImageNum == 5)
    {
      if(typeof F_part1 === 'undefined')
      {
        F_part1 = req.files[0].path;
        F_part2 = req.files[1].path;
        F_part3 = req.files[2].path;
        F_part4 = req.files[3].path;
        F_part5 = req.files[4].path;
      }
      else if(typeof F_part2 === 'undefined')
      {
        F_part2 = req.files[0].path;
        F_part3 = req.files[1].path;
        F_part4 = req.files[2].path;
        F_part5 = req.files[3].path;
      }
      else if(typeof F_part3 === 'undefined')
      {
        F_part3 = req.files[0].path;
        F_part4 = req.files[1].path;
        F_part5 = req.files[2].path;
      }
      else if(typeof F_part4 === 'undefined')
      {
        F_part4 = req.files[0].path;
        F_part5 = req.files[1].path;
      }
      else if(typeof F_part5 === 'undefined')
      {
        F_part5 = req.files[0].path;
      }
    }

    F_Title = F_Title.replace(/\"/gi, "");
    F_Subject = F_Subject.replace(/\"/gi, "");
    F_Content = F_Content.replace(/\"/gi, "");

    Forum.findOneAndUpdate({
      "idx": F_idx
    }, {
      $set: {
        Title: F_Title,
        Content: F_Content,
        Subject: F_Subject,
        ImageNum: req.body.ImageNum,
        Image0path: F_part1,
        Image1path: F_part2,
        Image2path: F_part3,
        Image3path: F_part4,
        Image4path: F_part5
      }
    }, {
      new: true,
    }, function(err, forum) {
      if (err) {
        console.log("forum에러 : " + err);
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
        console.log("modifyforum성공 : " + JSON.stringify(forum));
        res.json({
          type: true,
        });
      }
    });
  });

  return router; //라우터를 리턴
}
