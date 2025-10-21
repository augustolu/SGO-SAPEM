const { authJwt } = require("../middleware");
const controller = require("../controllers/geocode.controller.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Ruta para búsqueda de direcciones (texto a coordenadas)
  app.get("/geocode/search", [authJwt.verifyToken], controller.search);

  // Ruta para búsqueda inversa (coordenadas a texto)
  app.get("/geocode/reverse", [authJwt.verifyToken], controller.reverse);
};