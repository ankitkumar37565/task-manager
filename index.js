const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
//load middleware
app.use(bodyParser.json());
//connecting to database
require("./db/mongoose")();
//load the mongoose models
const { task } = require("./db/models/task");
const { project } = require("./db/models/project");
const { user } = require("./db/models/user");
//load the project routes

/**
 * GET /projects
 * Purpose: Get all projects
 */
app.get("/projects", /*authenticate*/ verifyToken, (req, res) => {
  // We want to return an array of all the projects that belong to the authenticated user
  project
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
app.post("/projects", /*authenticate*/ verifyToken, (req, res) => {
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
app.patch("/projects/:id", /*authenticate*/ verifyToken, (req, res) => {
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
app.delete("/projects/:id", /*authenticate*/ verifyToken, (req, res) => {
  // We want to delete the specified project (document with id in the URL)
  project
    .findOneAndRemove({
      _id: req.params.id,
      _userId: req.user_id,
    })
    .then((removedprojectDoc) => {
      res.send(removedprojectDoc);

      // delete all the tasks that are in the deleted project
      // deletetasksFromproject(removedprojectDoc._id);
    });
});
/* HELPER METHODS */
let deletetasksFromproject = (_listId) => {
  task
    .deleteMany({
      _listId,
    })
    .then(() => {
      console.log("tasks from " + _listId + " were deleted!");
    });
};

//load the task routes
/**
 * GET /projects/:projectId/tasks
 * Purpose: Get all tasks in a specific project
 */
app.get(
  "/projects/:projectId/tasks",
  /*authenticate*/ verifyToken,
  (req, res) => {
    // We want to return all tasks that belong to a specific project (specified by projectId)
    task
      .find({
        _projectId: req.params.projectId,
      })
      .then((tasks) => {
        res.send(tasks);
      });
  }
);

/**
 * POST /projects/:projectId/tasks
 * Purpose: Create a new task in a specific project
 */
app.post(
  "/projects/:projectId/tasks",
  /*authenticate*/ verifyToken,
  (req, res) => {
    // We want to create a new task in a project specified by projectId

    project
      .findOne({
        _id: req.params.projectId,
        _userId: req.user_id,
      })
      .then((project) => {
        if (project) {
          // project object with the specified conditions was found
          // therefore the currently authenticated user can create new tasks
          return true;
        }

        // else - the project object is undefined
        return false;
      })
      .then((canCreatetask) => {
        if (canCreatetask) {
          let newtask = new task({
            title: req.body.title,
            _projectId: req.params.projectId,
          });
          newtask.save().then((newtaskDoc) => {
            res.send(newtaskDoc);
          });
        } else {
          res.sendStatus(404);
        }
      });
  }
);

/**
 * PATCH /projects/:projectId/tasks/:taskId
 * Purpose: Update an existing task
 */
app.patch(
  "/projects/:projectId/tasks/:taskId",
  /*authenticate*/ verifyToken,
  (req, res) => {
    // We want to update an existing task (specified by taskId)

    project
      .findOne({
        _id: req.params.projectId,
        _userId: req.user_id,
      })
      .then((project) => {
        if (project) {
          // project object with the specified conditions was found
          // therefore the currently authenticated user can make updates to tasks within this project
          return true;
        }

        // else - the project object is undefined
        return false;
      })
      .then((canUpdatetasks) => {
        if (canUpdatetasks) {
          // the currently authenticated user can update tasks
          task
            .findOneAndUpdate(
              {
                _id: req.params.taskId,
                _projectId: req.params.projectId,
              },
              {
                $set: req.body,
              }
            )
            .then(() => {
              res.send({ message: "Updated successfully." });
            });
        } else {
          res.sendStatus(404);
        }
      });
  }
);

/**
 * DELETE /projects/:projectId/tasks/:taskId
 * Purpose: Delete a task
 */
app.delete(
  "/projects/:projectId/tasks/:taskId",
  /*authenticate*/ verifyToken,
  (req, res) => {
    project
      .findOne({
        _id: req.params.projectId,
        _userId: req.user_id,
      })
      .then((project) => {
        if (project) {
          // project object with the specified conditions was found
          // therefore the currently authenticated user can make updates to tasks within this project
          return true;
        }

        // else - the project object is undefined
        return false;
      })
      .then((canDeletetasks) => {
        if (canDeletetasks) {
          task
            .findOneAndRemove({
              _id: req.params.taskId,
              _projectId: req.params.projectId,
            })
            .then((removedtaskDoc) => {
              res.send(removedtaskDoc);
            });
        } else {
          res.sendStatus(404);
        }
      });
  }
);
//end task routes

//user routes
//signup user
app.post("/signup", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let role = req.body.role;
  let newuser = new user({
    email,
    password,
    role,
    // _userId:req.user_id
  });
  newuser.save().then((userdoc) => {
    res.send(userdoc);
  });
});
//login
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let role = req.body.role;

  let newuser = new user({
    email,
    password,
    role,
  });
  jwt.sign({ user }, "secretkey", { expiresIn: "15s" }, (err, token) => {
    res.json({ token });
  });
});
function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  }
}
//start the app on port 3000
app.listen(3000, () => {
  console.log(`server listening on port 3000`);
});
