const db = require("../models");
const Localidad = db.Localidades;
const { Op } = db.Sequelize;

// Crear y guardar una nueva Localidad
exports.create = (req, res) => {
  if (!req.body.nombre) {
    return res.status(400).send({ message: "El nombre no puede estar vacío." });
  }

  Localidad.create({ nombre: req.body.nombre })
    .then(data => {
      // Devolvemos la localidad creada, incluyendo su nuevo ID
      res.status(201).send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al crear la Localidad."
      });
    });
};

// Obtener todas las Localidades, con opción de búsqueda por nombre
exports.findAll = (req, res) => {
  const { nombre } = req.query;
  const condition = nombre ? { nombre: { [Op.like]: `${nombre}%` } } : null;

  Localidad.findAll({ where: condition, order: [['nombre', 'ASC']] })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al obtener las Localidades."
      });
    });
};