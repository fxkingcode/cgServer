var mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  imageUrl:String,
  birth: { type: Date, default: Date.now },
  replyCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },//답글이면 답글을 남긴 코멘트의 id
  replies:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Reply' }],//답글들
  user:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },//작성자
  forumIdx: { type: Number, required: true },//해당 답글이 있는 포럼
  id: mongoose.Schema.Types.ObjectId
});

// Create new todo document
commentSchema.statics.create = function (payload) {
  // this === Model
  const comment = new this(payload);
  // return Promise
  return comment.save();
};

// Find All
commentSchema.statics.findAll = function () {
  // return promise
  // V4부터 exec() 필요없음
  return this.find({});
};

// Find One by todoid
commentSchema.statics.findOneById = function (idx) {
  return this.findOne({ idx });
};

// Update by todoid
commentSchema.statics.updateById = function (idx, payload) {
  // { new: true }: return the modified document rather than the original. defaults to false
  return this.findOneAndUpdate({ idx }, payload, { new: true });
};

// Delete by todoid
commentSchema.statics.deleteById = function (idx) {
  return this.remove({ idx });
};

module.exports = mongoose.model('Comment', commentSchema);
