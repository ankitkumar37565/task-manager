const AccessControl = require("accesscontrol");
const ac = new AccessControl();
exports.roles = (function () {
  ac.grant("user")
    .readOwn("profile")
    .updateOwn("profile");
  ac.grant("manager")
    .extend("user")
    .read("project")
    .update("project")
    .create("project")
    .delete("project")
    .readAny("profile")
    .updateAny("profile")
    .deleteAny("profile");
  return ac;
})();
