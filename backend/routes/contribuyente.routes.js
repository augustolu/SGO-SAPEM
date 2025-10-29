module.exports = app => {
    const contribuyentes = require("../controllers/contribuyente.controller.js");
  
    var router = require("express").Router();
  
    // Crear un nuevo Contribuyente
    router.post("/", contribuyentes.create);
  
    // Obtener todos los Contribuyentes
    router.get("/", contribuyentes.findAll);
  
    app.use('/contribuyentes', router);
};