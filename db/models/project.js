const mongoose = require("mongoose");
const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
  },
  //auth
  // _userId: {
  //   type: mongoose.Types.ObjectId,
  //   required: true,
  // },
});

const project = mongoose.model("project", projectSchema);
module.exports = { project };
