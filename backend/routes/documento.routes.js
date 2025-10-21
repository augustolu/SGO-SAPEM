
const { authJwt } = require("../middleware");
const documentos = require("../controllers/documento.controller.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Create a new Documento
  app.post("/documentos", [authJwt.verifyToken], documentos.create);

  // Retrieve all Documentos
  app.get("/documentos", [authJwt.verifyToken], documentos.findAll);

  // Retrieve a single Documento with id
  app.get("/documentos/:id", [authJwt.verifyToken], documentos.findOne);

  // Update a Documento with id
  app.put("/documentos/:id", [authJwt.verifyToken], documentos.update);

  // Delete a Documento with id
  app.delete("/documentos/:id", [authJwt.verifyToken], documentos.delete);

  // Delete all Documentos
  app.delete("/documentos", [authJwt.verifyToken], documentos.deleteAll);
};
