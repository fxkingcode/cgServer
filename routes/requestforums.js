module.exports = function(app) {
  var express = require('express');
  var router = express.Router();
  var bodyParser = require("body-parser");
  var mongoose = require('mongoose');

  app.use(bodyParser.urlencoded({
    extended: false
  }));

  router.post('/', (req, res) => {
    var CurrentPage = req.body.CurrentPage;
    var Bestforums = req.body.Bestforums;

    if(Bestforums == "true")
    {
      mongoose.model('forum').find({"RecommendNum": {$gte: 10}}).sort({
        "idx": -1
      }).skip((CurrentPage - 1) * 10).limit(10).exec(function(err, doc) {
        if (err) {
          console.log("에러 : " + err);
        } else {
          if(!doc)
          {
            console.log("없다");
            res.json({
              type:false
            });
          }else {
            res.json({
              type:true,
              data:doc
            });
          }
        }
      });
    }
    else {
      mongoose.model('forum').find().sort({
        "idx": -1
      }).skip((CurrentPage - 1) * 10).limit(10).exec(function(err, doc) {
        if (err) {
          console.log("에러 : " + err);
        } else {
          if(!doc)
          {
            console.log("없다");
            res.json({
              type:false
            });
          }else {
            res.json({
              type:true,
              data:doc
            });
          }
        }
      });
    }
  });

  return router; //라우터를 리턴
}
