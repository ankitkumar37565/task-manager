const mongoose = require('mongoose');
const Schema=mongoose.Schema;


//user schema
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum:['user','Manager'], default:'user'},
});

module.exports = mongoose.model("user", userSchema);
