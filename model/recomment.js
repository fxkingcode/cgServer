var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var recommentSchema = new Schema({
    commentUid:String,
    Email: String,
    Nickname: String,
    recomment_Content: String,
    recomment_Date: {
      type: Date,
      default: Date.now()
    },
    IsImage: Boolean,
    recomment_Imagepath: String
  });

module.exports = mongoose.model('recomment', recommentSchema);
