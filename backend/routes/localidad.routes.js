module.exports = app => {
    const localidades = require("../controllers/localidad.controller.js");
  
    var router = require("express").Router();
  
    // Crear una nueva Localidad
    router.post("/", localidades.create);
  
    // Obtener todas las Localidades
    router.get("/", localidades.findAll);
  
    app.use('/localidades', router);
};