var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var usersSchema = new Schema({
    Email: String,
    Password: String,
		Nickname: String,
		PhoneNum: String,
    signupDate: { type: Date, default: Date.now  },
    Profile: String,
    Introduce: String,
    Hobbit1: String,
    Hobbit2: String,
    Hobbit3: String
});

module.exports = mongoose.model('user', usersSchema);
