const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
//function to handle the error
const use = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
router.post("/signup", use(userController.signup));

router.post("/login", use(userController.login));

router.get(
  "/user/:userId",
  userController.allowIfLoggedin,
  use(userController.getUser)
);

router.get(
  "/users",
  userController.allowIfLoggedin,
  use(userController.getUsers)
);

router.put(
  "/users/:userId",
  userController.allowIfLoggedin,
  userController.grantAccess("updateAny", "profile"),
  use(userController.updateUsers
));

router.delete(
  "/users/:userId",
  userController.allowIfLoggedin,
  userController.grantAccess("deleteAny", "profile"),
  use(userController.deleteUser
));
module.exports = router;
