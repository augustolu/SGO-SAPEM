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
  app.get("/usuarios/inspectores", [authJwt.verifyToken], controller.findAllInspectores);
  // -------------------------
  app.get("/users", [authJwt.verifyToken, authJwt.isAdmin], controller.findAll);
  app.put("/users/:id", [authJwt.verifyToken], controller.updateProfile); // <-- RUTA AÑADIDA

  // Ruta para solicitar el cambio de email
  app.post(
    "/users/request-email-change",
    [authJwt.verifyToken],
    controller.requestEmailChange
  );

  app.put("/users/:id/role", [authJwt.verifyToken, authJwt.isAdmin], controller.updateRole);
  app.delete("/users/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.delete);
};