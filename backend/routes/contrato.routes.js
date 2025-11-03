const controller = require('../controllers/contrato.controller');
const { authJwt } = require('../middleware');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/obras/:obraId/contratos/upload", [authJwt.verifyToken], controller.uploadContrato);
  app.get("/api/obras/:obraId/contratos", [authJwt.verifyToken], controller.getContratosByObra);
  app.delete("/api/contratos/:id", [authJwt.verifyToken], controller.deleteContrato);
};
