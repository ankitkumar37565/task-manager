const mongoose = require("mongoose");
//we will connect to database
function connectDb() {
  mongoose.connect("mongodb://localhost/task_manager");
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "error connecting to database"));
  db.once("open", function () {
    console.log("successfully connected to database");
  });
}
module.exports=connectDb;