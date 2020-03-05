var mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
var autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.createConnection("mongodb://localhost:27017/chatground", {
  useNewUrlParser: true
});
autoIncrement.initialize(connection);

const forumSchema = new mongoose.Schema({
  title: { type: String, required: true},//필수,
  content: { type: String, required: true },
  subject: { type: String, required: true },
  imageUrl:[String],
  birth: { type: Date, default: Date.now },
  recommend: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],//내가 쓴 글
  user:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },//유저
  idx: Number,
});

forumSchema.plugin(autoIncrement.plugin, {
  model: 'Forum',
  field: 'idx',
  startAt: 1,
  increment: 1
});

// Create new todo document
forumSchema.statics.create = function (payload) {
  // this === Model
  const forum = new this(payload);
  // return Promise
  return forum.save();
};

// Find All
forumSchema.statics.findAll = function () {
  // return promise
  // V4부터 exec() 필요없음
  return this.find({});
};

// Find One by todoid
forumSchema.statics.findOneById = function (idx) {
  return this.findOne({ idx });
};

// Update by todoid
forumSchema.statics.updateById = function (idx, payload) {
  // { new: true }: return the modified document rather than the original. defaults to false
  return this.findOneAndUpdate({ idx }, payload, { new: true });
};

// Delete by todoid
forumSchema.statics.deleteById = function (idx) {
  return this.remove({ idx });
};

module.exports = mongoose.model('Forum', forumSchema);
