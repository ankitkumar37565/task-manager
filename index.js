const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: "./.env" });
//connecting to database
require("./db/mongoose")();
//load the mongoose models
const { task } = require("./db/models/task");
const { project } = require("./db/models/project");
const { User } = require("./db/models/user");
//import the routes
const routes = require("./routes/route");
const projectRoutes = require("./routes/projectRoute");
const taskRoutes = require("./routes/taskRoute");
//global middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function (err, req, res, next) {
  console.log(err);
  res.status(500).send({ message: "something went wrong" });
});

//loading routes
app.use("/", routes);
app.use("/", projectRoutes);
app.use("/", taskRoutes);

//start the app on port 3000
app.listen(3000, () => {
  console.log(`server listening on port 3000`);
});
