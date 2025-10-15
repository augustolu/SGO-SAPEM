
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
  app.post("/api/obras", [authJwt.verifyToken], obras.create);

  // Retrieve all Obras
  app.get("/api/obras", [authJwt.verifyToken], obras.findAll);

  // Retrieve a single Obra with id
  app.get("/api/obras/:id", [authJwt.verifyToken], obras.findOne);

  // Update a Obra with id
  app.put("/api/obras/:id", [authJwt.verifyToken], obras.update);

  // Delete a Obra with id
  app.delete("/api/obras/:id", [authJwt.verifyToken], obras.delete);

  // Delete all Obras
  app.delete("/api/obras", [authJwt.verifyToken], obras.deleteAll);
};
