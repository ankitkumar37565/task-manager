const express = require("express");
const app = express();
const mongoose = require("mongoose");
const port = 8000;
const db = require("./config/mongoose");
const jwt = require("jsonwebtoken");
//import mongoose models
const user = require("./models/user");
const task = require("./models/task");
const project = require("./models/project");

//create user
app.post("/create-user", function (req, res) {
  user.create(
    {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
    },
    function (err, newUser) {
      if (err) {
        console.log("error in creating user");
        return;
      }
      console.log("new user created");
      return res.redirect("back");
    }
  );
});

//get the token
app.post("/api/login", (req, res) => {
  //check if user exist
  user.findById(_id).then((user) => {
    if (!user) {
      // user couldn't be found
      return res.json({
        message: "user not found",
      });
    }
    //user found now create the jwt token
    jwt.sign({ user: user }, "secretkey", { expiresIn: "1h" }, (err, token) => {
      res.json({
        token: token,
      });
    });
  });
});

// check whether the request has a valid JWT access token
//format of token
//authorization: bearer <access_token>
//verify token
function verifyToken(req, res, next) {
  //get auth header value
  const bearerHeader = req.headers["authorization"];
  //check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    //split at the space
    const bearer = bearerHeader.split(" ");
    //get token from array
    const bearerToken = bearer[1];
    //set the token
    req.token = bearerToken;
    //next middleware
    next();
  } else {
    //forbidden
    res.sendStatus(403);
  }
}

/**
 * GET /projects
 * Purpose: Get all projects
 */
app.get("/projects", verifyToken, (req, res) => {
  // We want to return an array of all the projects that belong to the verifyToken user
  projects
    .find({
      _userId: req.user_id,
    })
    .then((projects) => {
      res.send(projects);
    })
    .catch((e) => {
      res.send(e);
    });
});

/**
 * POST /projects
 * Purpose: Create a project
 */
app.post("/projects", verifyToken, (req, res) => {
  // We want to create a new project and return the new project document back to the user (which includes the id)
  // The project information (fields) will be passed in via the JSON request body
  let title = req.body.title;

  let newproject = new project({
    title,
    _userId: req.user_id,
  });
  newproject.save().then((projectDoc) => {
    // the full project document is returned (incl. id)
    res.send(projectDoc);
  });
});

/**
 * PATCH /projects/:id
 * Purpose: Update a specified project
 */
app.patch("/projects/:id", verifyToken, (req, res) => {
  // We want to update the specified project (project document with id in the URL) with the new values specified in the JSON body of the request
  project
    .findOneAndUpdate(
      { _id: req.params.id, _userId: req.user_id },
      {
        $set: req.body,
      }
    )
    .then(() => {
      res.send({ message: "updated successfully" });
    });
});

/**
 * DELETE /projects/:id
 * Purpose: Delete a project
 */
app.delete("/projects/:id", verifyToken, (req, res) => {
  // We want to delete the specified project (document with id in the URL)
  project
    .findOneAndRemove({
      _id: req.params.id,
      _userId: req.user_id,
    })
    .then((removedprojectDoc) => {
      res.send(removedprojectDoc);

      // delete all the tasks that are in the deleted project
      deleteTasksFromproject(removedprojectDoc._id);
    });
});

/**
 * GET /projects/:projectId/tasks
 * Purpose: Get all tasks in a specific project
 */
app.get("/projects/:projectId/tasks", verifyToken, (req, res) => {
  // We want to return all tasks that belong to a specific project (specified by projectId)
  Task.find({
    _projectId: req.params.projectId,
  }).then((tasks) => {
    res.send(tasks);
  });
});

/**
 * POST /projects/:projectId/tasks
 * Purpose: Create a new task in a specific project
 */
app.post("/projects/:projectId/tasks", verifyToken, (req, res) => {
  // We want to create a new task in a project specified by projectId

  project
    .findOne({
      _id: req.params.projectId,
      _userId: req.user_id,
    })
    .then((project) => {
      if (project) {
        // project object with the specified conditions was found
        // therefore the currently verifyTokend user can create new tasks
        return true;
      }

      // else - the project object is undefined
      return false;
    })
    .then((canCreateTask) => {
      if (canCreateTask) {
        let newTask = new Task({
          title: req.body.title,
          _projectId: req.params.projectId,
        });
        newTask.save().then((newTaskDoc) => {
          res.send(newTaskDoc);
        });
      } else {
        res.sendStatus(404);
      }
    });
});

/**
 * PATCH /projects/:projectId/tasks/:taskId
 * Purpose: Update an existing task
 */
app.patch("/projects/:projectId/tasks/:taskId", verifyToken, (req, res) => {
  // We want to update an existing task (specified by taskId)

  project
    .findOne({
      _id: req.params.projectId,
      _userId: req.user_id,
    })
    .then((project) => {
      if (project) {
        // project object with the specified conditions was found
        // therefore the currently verifyTokend user can make updates to tasks within this project
        return true;
      }

      // else - the project object is undefined
      return false;
    })
    .then((canUpdateTasks) => {
      if (canUpdateTasks) {
        // the currently verifyTokend user can update tasks
        Task.findOneAndUpdate(
          {
            _id: req.params.taskId,
            _projectId: req.params.projectId,
          },
          {
            $set: req.body,
          }
        ).then(() => {
          res.send({ message: "Updated successfully." });
        });
      } else {
        res.sendStatus(404);
      }
    });
});

/**
 * DELETE /projects/:projectId/tasks/:taskId
 * Purpose: Delete a task
 */
app.delete("/projects/:projectId/tasks/:taskId", verifyToken, (req, res) => {
  project
    .findOne({
      _id: req.params.projectId,
      _userId: req.user_id,
    })
    .then((project) => {
      if (project) {
        // project object with the specified conditions was found
        // therefore the currently verifyTokend user can make updates to tasks within this project
        return true;
      }

      // else - the project object is undefined
      return false;
    })
    .then((canDeleteTasks) => {
      if (canDeleteTasks) {
        Task.findOneAndRemove({
          _id: req.params.taskId,
          _projectId: req.params.projectId,
        }).then((removedTaskDoc) => {
          res.send(removedTaskDoc);
        });
      } else {
        res.sendStatus(404);
      }
    });
});

/* USER ROUTES */

/**
 * POST /users
 * Purpose: Sign up
 */
app.post("/users", (req, res) => {
  // User sign up

  let body = req.body;
  let newUser = new User(body);

  newUser
    .save()
    .then(() => {
      return newUser.createSession();
    })
    .then((refreshToken) => {
      // Session created successfully - refreshToken returned.
      // now we geneate an access auth token for the user

      return newUser.generateAccessAuthToken().then((accessToken) => {
        // access auth token generated successfully, now we return an object containing the auth tokens
        return { accessToken, refreshToken };
      });
    })
    .then((authTokens) => {
      // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
      res
        .header("x-refresh-token", authTokens.refreshToken)
        .header("x-access-token", authTokens.accessToken)
        .send(newUser);
    })
    .catch((e) => {
      res.status(400).send(e);
    });
});

/**
 * POST /users/login
 * Purpose: Login
 */
app.post("/users/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  User.findByCredentials(email, password)
    .then((user) => {
      return user
        .createSession()
        .then((refreshToken) => {
          // Session created successfully - refreshToken returned.
          // now we geneate an access auth token for the user

          return user.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken };
          });
        })
        .then((authTokens) => {
          // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
          res
            .header("x-refresh-token", authTokens.refreshToken)
            .header("x-access-token", authTokens.accessToken)
            .send(user);
        });
    })
    .catch((e) => {
      res.status(400).send(e);
    });
});

/* HELPER METHODS */
let deleteTasksFromproject = (_projectId) => {
  Task.deleteMany({
    _projectId,
  }).then(() => {
    console.log("Tasks from " + _projectId + " were deleted!");
  });
};

app.listen(port, function (err) {
  if (err) {
    console.log("error in server");
    return;
  }
  console.log(`server running on port ${port}`);
  return;
});
