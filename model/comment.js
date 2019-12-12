var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var commentSchema = new Schema({
    Email: String,
    Nickname: String,
    comment_Content: String,
    comment_Date: {type: Date, default: Date.now()},
    IsImage: Boolean,
    comment_Imagepath: String
});

module.exports = mongoose.model('comment', commentSchema);
