const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
  },
  _projectId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
});

const task = mongoose.model("task", taskSchema);
module.exports = { task };
