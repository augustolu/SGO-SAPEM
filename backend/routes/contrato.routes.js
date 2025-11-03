const controller = require('../controllers/contrato.controller');
const { authJwt } = require('../middleware');
const upload = require('../middleware/upload'); // Importar el middleware de subida

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/obras/:obraId/contratos/upload", [authJwt.verifyToken, (req, res, next) => { console.log("Route: /api/obras/:obraId/contratos/upload reached."); next(); }, upload], controller.uploadContrato);
  app.get("/obras/:obraId/contratos", [authJwt.verifyToken], controller.getContratosByObra);
  app.delete("/contratos/:id", [authJwt.verifyToken], controller.deleteContrato);
};
