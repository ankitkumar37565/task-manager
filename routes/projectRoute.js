const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { project } = require("../db/models/project");
const { task } = require("../db/models/task");

/**
 * GET /projects
 * Purpose: Get all projects
 */
router.get("/projects",userController.allowIfLoggedin, (req, res) => {
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
router.post("/projects",userController.allowIfLoggedin, userController.grantAccess("create", "project"), (req, res) => {
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
router.put("/projects/:id",userController.allowIfLoggedin,userController.grantAccess("update", "project"), (req, res) => {
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
router.delete("/projects/:id",userController.allowIfLoggedin,userController.grantAccess("delete", "project"), (req, res) => {
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
module.exports = router;
