const express = require("express");
const app = express();
const mongoose = require("mongoose");
const port = 8000;
const db = require("./config/mongoose");
const jwt = require('jsonwebtoken');
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

/* MIDDLEWARE  */

// Load middleware
app.use(bodyParser.json());
// HEADERS MIDDLEWARE

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

  res.header(
      'Access-Control-Expose-Headers',
      'x-access-token, x-refresh-token'
  );

  next();
});


// check whether the request has a valid JWT access token
let authenticate = (req, res, next) => {
  let token = req.header('x-access-token');

  // verify the JWT
  jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
      if (err) {
          // there was an error
          // jwt is invalid - * DO NOT AUTHENTICATE *
          res.status(401).send(err);
      } else {
          // jwt is valid
          req.user_id = decoded._id;
          next();
      }
  });
}

// Verify Refresh Token Middleware (which will be verifying the session)
let verifySession = (req, res, next) => {
  // grab the refresh token from the request header
  let refreshToken = req.header('x-refresh-token');

  // grab the _id from the request header
  let _id = req.header('_id');

  User.findByIdAndToken(_id, refreshToken).then((user) => {
      if (!user) {
          // user couldn't be found
          return Promise.reject({
              'error': 'User not found. Make sure that the refresh token and user id are correct'
          });
      }


      //  the user was found
      // therefore the refresh token exists in the database - but we still have to check if it has expired or not

      req.user_id = user._id;
      req.userObject = user;
      req.refreshToken = refreshToken;

      let isSessionValid = false;

      user.sessions.forEach((session) => {
          if (session.token === refreshToken) {
              // check if the session has expired
              if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                  // refresh token has not expired
                  isSessionValid = true;
              }
          }
      });

      if (isSessionValid) {
          // the session is VALID - call next() to continue with processing this web request
          next();
      } else {
          // the session is not valid
          return Promise.reject({
              'error': 'Refresh token has expired or the session is invalid'
          })
      }

  }).catch((e) => {
      res.status(401).send(e);
  })
}

/* END MIDDLEWARE  */



/**
* GET /projects
* Purpose: Get all projects
*/
app.get('/projects', authenticate, (req, res) => {
  // We want to return an array of all the projects that belong to the authenticated user 
  projects.find({
      _userId: req.user_id
  }).then((projects) => {
      res.send(projects);
  }).catch((e) => {
      res.send(e);
  });
})

/**
* POST /projects
* Purpose: Create a project
*/
app.post('/projects', authenticate, (req, res) => {
  // We want to create a new project and return the new project document back to the user (which includes the id)
  // The project information (fields) will be passed in via the JSON request body
  let title = req.body.title;

  let newproject = new project({
      title,
      _userId: req.user_id
  });
  newproject.save().then((projectDoc) => {
      // the full project document is returned (incl. id)
      res.send(projectDoc);
  })
});

/**
* PATCH /projects/:id
* Purpose: Update a specified project
*/
app.patch('/projects/:id', authenticate, (req, res) => {
  // We want to update the specified project (project document with id in the URL) with the new values specified in the JSON body of the request
  project.findOneAndUpdate({ _id: req.params.id, _userId: req.user_id }, {
      $set: req.body
  }).then(() => {
      res.send({ 'message': 'updated successfully'});
  });
});

/**
* DELETE /projects/:id
* Purpose: Delete a project
*/
app.delete('/projects/:id', authenticate, (req, res) => {
  // We want to delete the specified project (document with id in the URL)
  project.findOneAndRemove({
      _id: req.params.id,
      _userId: req.user_id
  }).then((removedprojectDoc) => {
      res.send(removedprojectDoc);

      // delete all the tasks that are in the deleted project
      deleteTasksFromproject(removedprojectDoc._id);
  })
});


/**
* GET /projects/:projectId/tasks
* Purpose: Get all tasks in a specific project
*/
app.get('/projects/:projectId/tasks', authenticate, (req, res) => {
  // We want to return all tasks that belong to a specific project (specified by projectId)
  Task.find({
      _projectId: req.params.projectId
  }).then((tasks) => {
      res.send(tasks);
  })
});


/**
* POST /projects/:projectId/tasks
* Purpose: Create a new task in a specific project
*/
app.post('/projects/:projectId/tasks', authenticate, (req, res) => {
  // We want to create a new task in a project specified by projectId

  project.findOne({
      _id: req.params.projectId,
      _userId: req.user_id
  }).then((project) => {
      if (project) {
          // project object with the specified conditions was found
          // therefore the currently authenticated user can create new tasks
          return true;
      }

      // else - the project object is undefined
      return false;
  }).then((canCreateTask) => {
      if (canCreateTask) {
          let newTask = new Task({
              title: req.body.title,
              _projectId: req.params.projectId
          });
          newTask.save().then((newTaskDoc) => {
              res.send(newTaskDoc);
          })
      } else {
          res.sendStatus(404);
      }
  })
})

/**
* PATCH /projects/:projectId/tasks/:taskId
* Purpose: Update an existing task
*/
app.patch('/projects/:projectId/tasks/:taskId', authenticate, (req, res) => {
  // We want to update an existing task (specified by taskId)

  project.findOne({
      _id: req.params.projectId,
      _userId: req.user_id
  }).then((project) => {
      if (project) {
          // project object with the specified conditions was found
          // therefore the currently authenticated user can make updates to tasks within this project
          return true;
      }

      // else - the project object is undefined
      return false;
  }).then((canUpdateTasks) => {
      if (canUpdateTasks) {
          // the currently authenticated user can update tasks
          Task.findOneAndUpdate({
              _id: req.params.taskId,
              _projectId: req.params.projectId
          }, {
                  $set: req.body
              }
          ).then(() => {
              res.send({ message: 'Updated successfully.' })
          })
      } else {
          res.sendStatus(404);
      }
  })
});

/**
* DELETE /projects/:projectId/tasks/:taskId
* Purpose: Delete a task
*/
app.delete('/projects/:projectId/tasks/:taskId', authenticate, (req, res) => {

  project.findOne({
      _id: req.params.projectId,
      _userId: req.user_id
  }).then((project) => {
      if (project) {
          // project object with the specified conditions was found
          // therefore the currently authenticated user can make updates to tasks within this project
          return true;
      }

      // else - the project object is undefined
      return false;
  }).then((canDeleteTasks) => {
      
      if (canDeleteTasks) {
          Task.findOneAndRemove({
              _id: req.params.taskId,
              _projectId: req.params.projectId
          }).then((removedTaskDoc) => {
              res.send(removedTaskDoc);
          })
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
app.post('/users', (req, res) => {
  // User sign up

  let body = req.body;
  let newUser = new User(body);

  newUser.save().then(() => {
      return newUser.createSession();
  }).then((refreshToken) => {
      // Session created successfully - refreshToken returned.
      // now we geneate an access auth token for the user

      return newUser.generateAccessAuthToken().then((accessToken) => {
          // access auth token generated successfully, now we return an object containing the auth tokens
          return { accessToken, refreshToken }
      });
  }).then((authTokens) => {
      // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
      res
          .header('x-refresh-token', authTokens.refreshToken)
          .header('x-access-token', authTokens.accessToken)
          .send(newUser);
  }).catch((e) => {
      res.status(400).send(e);
  })
})


/**
* POST /users/login
* Purpose: Login
*/
app.post('/users/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  User.findByCredentials(email, password).then((user) => {
      return user.createSession().then((refreshToken) => {
          // Session created successfully - refreshToken returned.
          // now we geneate an access auth token for the user

          return user.generateAccessAuthToken().then((accessToken) => {
              // access auth token generated successfully, now we return an object containing the auth tokens
              return { accessToken, refreshToken }
          });
      }).then((authTokens) => {
          // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
          res
              .header('x-refresh-token', authTokens.refreshToken)
              .header('x-access-token', authTokens.accessToken)
              .send(user);
      })
  }).catch((e) => {
      res.status(400).send(e);
  });
})


/**
* GET /users/me/access-token
* Purpose: generates and returns an access token
*/
app.get('/users/me/access-token', verifySession, (req, res) => {
  // we know that the user/caller is authenticated and we have the user_id and user object available to us
  req.userObject.generateAccessAuthToken().then((accessToken) => {
      res.header('x-access-token', accessToken).send({ accessToken });
  }).catch((e) => {
      res.status(400).send(e);
  });
})



/* HELPER METHODS */
let deleteTasksFromproject = (_projectId) => {
  Task.deleteMany({
      _projectId
  }).then(() => {
      console.log("Tasks from " + _projectId + " were deleted!");
  })
}


app.listen(port, function (err) {
  if (err) {
    console.log("error in server");
    return;
  }
  console.log(`server running on port ${port}`);
  return;
});
