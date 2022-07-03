const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  role: { type: String, enum: ["user", "manager"], default: "user" },
});

const user = mongoose.model("user", UserSchema);

module.exports = { user };
