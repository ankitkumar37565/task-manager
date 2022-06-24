const mongoose = require('mongoose');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');


// JWT Secret
const jwtSecret = "51778657246321226641fsdklafjasdkljfsklfjd7148924065";

//user schema
const userSchema = new Schema({
  name: { type: string, required: true },
  email: { type: string, required: true, unique: true },
  password: { type: string, required: true },
  role: { type: string, enum:['user','Manager'], default:'user'},
});

module.exports = mongoose.model("user", userSchema);
