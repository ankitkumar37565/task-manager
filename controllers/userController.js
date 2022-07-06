//userController
const User = require("../db/models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { roles } = require("../roles");
async function hashPassword(password) {
  // let pass=password.toString();
  return await bcrypt.hash(password, 10);
}
async function validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
exports.signup = async (req, res, next) => {
  const { email, password, role } = req.body;
  const hashedPassword = await hashPassword(password);
  const newUser = new User({
    email,
    password: hashedPassword,
    role: role || "user",
  });
  const accessToken = jwt.sign(
    { userId: newUser._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
  newUser.accessToken = accessToken;
  await newUser.save();
  res.json({
    data: newUser,
    accessToken,
  });
};
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new Error("email does not exist"));
  const validPassword = await validatePassword(password, user.password);
  if (!validPassword) return next(new Error("Password is not correct"));
  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  await User.findByIdAndUpdate(user._id, { accessToken });
  res.status(200).json({
    data: { email: user.email, role: user.role },
    accessToken,
  });
};
exports.getUsers = async (req, res, next) => {
  const users = await User.find({});
  res.status(200).json({
    data: users,
  });
};
exports.getUser = async (req, res, next) => {
  const userId = req.params.userId;
  const user = await User.findById(userId);
  if (!user) return next(new Error("User does not exist"));
  res.status(200).json({
    data: user,
  });
};
exports.updateUsers = async (req, res, next) => {
  const update = req.body;
  const userId = req.params.userId;
  await User.findByIdAndUpdate(userId, update);
  const user = await User.findById(userId);
  res.status(200).json({
    data: user,
    message: "User updated",
  });
};
exports.deleteUser = async (req, res, next) => {
  const userId = req.params.userId;
  await User.findByIdAndDelete(userId);
  res.status(200).json({
    data: null,
    message: "User deleted",
  });
};

exports.grantAccess = function (action, resource) {
  return async (req, res, next) => {
    try {
      const permission = roles.can(req.user.role)[action](resource);
      if (!permission.granted) {
        return res
          .status(401)
          .json({ error: "you dont have permission to perform this action" });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
exports.allowIfLoggedin = async (req, res, next) => {
  //updated

  if (req.headers["x-access-token"]) {
    const accessToken = req.headers["x-access-token"];
    const { userId, exp } = await jwt.verify(
      accessToken,
      process.env.JWT_SECRET
    );
    //check if token is correct
    if (!userId || !exp) {
      return res.status(401).json({
        error: "invalid token",
      });
    }
    //check if token has expired
    if (exp < Date.now().valueOf() / 1000) {
      return res.status(401).json({
        error: "jwt token has expired please login to obtain a new token",
      });
    }
    foundUser = await User.findById(userId);
  } else {
    return res.json({ error: "jwt token not provided" });
  }

  //updated

  try {
    const user = foundUser;
    if (!user)
      return res.status(401).json({
        error: "you need to be logged in to access this route",
      });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
