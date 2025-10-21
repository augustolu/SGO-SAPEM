
const { authJwt } = require("../middleware");
const actividades = require("../controllers/actividad.controller.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Create a new Actividad
  app.post("/actividades", [authJwt.verifyToken], actividades.create);

  // Retrieve all Actividades
  app.get("/actividades", [authJwt.verifyToken], actividades.findAll);

  // Retrieve a single Actividad with id
  app.get("/actividades/:id", [authJwt.verifyToken], actividades.findOne);

  // Update a Actividad with id
  app.put("/actividades/:id", [authJwt.verifyToken], actividades.update);

  // Delete a Actividad with id
  app.delete("/actividades/:id", [authJwt.verifyToken], actividades.delete);

  // Delete all Actividades
  app.delete("/actividades", [authJwt.verifyToken], actividades.deleteAll);
};
