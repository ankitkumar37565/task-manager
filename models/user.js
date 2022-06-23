const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//user schema
const userSchema = new Schema({
  name: { type: string, required: true },
  email: { type: string, required: true, unique: true },
  password: { type: string, required: true },
  role: { type: string },
});

module.exports = mongoose.model("user", userSchema);
