var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.createConnection("mongodb://localhost:27017/chatground_user", {
  useNewUrlParser: true
});
autoIncrement.initialize(connection);

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

var commentSchema = new Schema({
    Email: String,
    Nickname: String,
    comment_Content: String,
    comment_Date: {
      type: Date,
      default: Date.now()
    },
    IsImage: Boolean,
    comment_Imagepath: String,
    ReComments: [recommentSchema]
  });

var forumsSchema = new Schema({
  idx: Number,
  Email: String,
  Nickname: String,
  Title: String,
  Subject: String,
  Content: String,
  Comments: [commentSchema],
  Recommend: Number,
  Date: {
    type: Date,
    default: Date.now
  },
  ImageNum: Number,
  Image0path: String,
  Image1path: String,
  Image2path: String,
  Image3path: String,
  Image4path: String
});

forumsSchema.plugin(autoIncrement.plugin, {
  model: 'forum',
  field: 'idx',
  startAt: 1,
  increment: 1
});


module.exports = mongoose.model('forum', forumsSchema);
