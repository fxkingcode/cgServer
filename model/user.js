var mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },//필수,유일,소문자
  password: { type: String, required: true, trim: true },//필수,공백제거
  nickname: { type: String, required: true, unique: true },
  birth: { type: Date, default: Date.now },
  profile: String,
  introduce: String,
  forums:[{ type: Number, ref: 'Forum' }],//내가 쓴 글
  comments:[{ type: Number, ref: 'Forum' }],//내가 쓴 댓글
  id: mongoose.Schema.Types.ObjectId
});

// Create new todo document
userSchema.statics.create = function (payload) {
  // this === Model
  const user = new this(payload);
  // return Promise
  return user.save();
};

// Find All
userSchema.statics.findAll = function () {
  // return promise
  // V4부터 exec() 필요없음
  return this.find({});
};

// Find One by email
userSchema.statics.findOneByEmail = function (email) {
  return this.findOne({ email });
};

userSchema.statics.findOneByEmailAndPassword = function (email,password) {
  return this.findOne()
  .where('email').equals(email)
  .where('password').equals(password)
  .select('-password')
};

// Find One by nickname
userSchema.statics.findOneByNickname = function (nickname) {
  return this.findOne({ nickname });
};

// Find One by todoid
userSchema.statics.findOneById = function (id) {
  return this.findOne({ id });
};

// Update by todoid
userSchema.statics.updateById = function (_id, payload) {
  // { new: true }: return the modified document rather than the original. defaults to false
  return this.findOneAndUpdate({ _id }, payload, done);
};

// Delete by todoid
userSchema.statics.deleteById = function (id) {
  return this.remove({ id });
};

module.exports = mongoose.model('User', userSchema);
