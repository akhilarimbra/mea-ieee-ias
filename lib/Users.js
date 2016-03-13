var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/meaieeeias');
var userSchema = new mongoose.Schema({
   username: {type: String, unique: true},
   password: {type: String},
   firstname: String,
   lastname: String
});
var User = mongoose.model('user', userSchema);
module.exports = User;