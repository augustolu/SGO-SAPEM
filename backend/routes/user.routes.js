
const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // --- AÑADE ESTA LÍNEA ---
  app.get("/usuarios/inspectores", [authJwt.verifyToken, authJwt.isAdmin], controller.findAllInspectores);
  // -------------------------
  app.get("/users", [authJwt.verifyToken, authJwt.isAdmin], controller.findAll);
  app.put("/users/:id/role", [authJwt.verifyToken, authJwt.isAdmin], controller.updateRole);
  app.delete("/users/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.delete);
};
