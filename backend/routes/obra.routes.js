
const { authJwt } = require("../middleware");
const upload = require("../middleware/upload");
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
  app.post("/obras", [authJwt.verifyToken, authJwt.isSupervisorOrAdmin], obras.create);

  // Retrieve all Obras
  app.get("/obras", [authJwt.verifyToken], obras.findAll);

  // Retrieve a single Obra with id
  app.get("/obras/:id", [authJwt.verifyToken], obras.findOne);

  // Update a Obra with id
  app.put("/obras/:id", [authJwt.verifyToken], obras.update);

  // Delete a Obra with id
  app.delete("/obras/:id", [authJwt.verifyToken], obras.delete);

  // Delete all Obras
  app.delete("/obras", [authJwt.verifyToken], obras.deleteAll);

  // Asignar un inspector a una obra
  app.post("/obras/asignar-inspector", [authJwt.verifyToken, authJwt.isSupervisorOrAdmin], obras.asignarInspector);

  // Upload a contract for an Obra
  app.post("/obras/:id/upload-contrato", [authJwt.verifyToken, upload], obras.uploadContrato);

  // Retrieve all contracts for an Obra
  app.get("/obras/:id/contratos", [authJwt.verifyToken], obras.getContratos);

  // Delete a contract from an Obra
  app.delete("/obras/:obraId/contratos/:contratoId", [authJwt.verifyToken], obras.deleteContrato);
};
