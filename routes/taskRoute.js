const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { task } = require("../db/models/task");
const { project } = require("../db/models/project");
//load the task routes
/**
 * GET /projects/:projectId/tasks
 * Purpose: Get all tasks in a specific project
 */
router.get(
  "/projects/:projectId/tasks",userController.allowIfLoggedin,

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
router.post(
  "/projects/:projectId/tasks",userController.allowIfLoggedin,

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
router.put(
  "/projects/:projectId/tasks/:taskId",userController.allowIfLoggedin,

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
router.delete(
  "/projects/:projectId/tasks/:taskId",userController.allowIfLoggedin,

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
module.exports = router;
