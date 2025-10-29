module.exports = app => {
    const representantes = require("../controllers/representanteLegal.controller.js");
  
    var router = require("express").Router();
  
    // Crear un nuevo Representante Legal
    router.post("/", representantes.create);
  
    // Obtener todos los Representantes Legales
    router.get("/", representantes.findAll);
  
    app.use('/representantes-legales', router);
};