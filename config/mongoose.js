//require the library
const mongoose = require("mongoose");
//connect to the database
mongoose.connect("mongodb://localhost/task_manager");
//acquire the connection
const db = mongoose.connection;
//error
db.on("error", console.error.bind(console, "error connecting to database"));
//up and running
db.once("open", function () {
  console.log("sucessfully connected to database");
});
