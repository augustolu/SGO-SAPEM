
const { authJwt } = require("../middleware");
const obras = require("../controllers/obra.controller.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Create a new Obra
  app.post("/obras", [authJwt.verifyToken], obras.create);

  // Retrieve all Obras
  app.get("/obras", [authJwt.verifyToken], obras.findAll);

  // Check if a numero_gestion exists
  app.get("/obras/check-gestion/:numero_gestion", [authJwt.verifyToken], obras.checkNumeroGestion);

  // Retrieve a single Obra with id
  app.get("/obras/:id", [authJwt.verifyToken], obras.findOne);

  // Update a Obra with id
  app.put("/obras/:id", [authJwt.verifyToken], obras.update);

  // Delete a Obra with id
  app.delete("/obras/:id", [authJwt.verifyToken], obras.delete);

  // Delete all Obras
  app.delete("/obras", [authJwt.verifyToken], obras.deleteAll);
};
