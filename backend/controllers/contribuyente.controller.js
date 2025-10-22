const db = require("../models");
const Contribuyente = db.Contribuyentes;
const { Op } = db.Sequelize;

// Crear y guardar un nuevo Contribuyente
exports.create = (req, res) => {
  if (!req.body.nombre) {
    return res.status(400).send({ message: "El nombre no puede estar vacío." });
  }

  Contribuyente.create({ nombre: req.body.nombre })
    .then(data => {
      // Devolvemos el contribuyente creado, incluyendo su nuevo ID
      res.status(201).send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al crear el Contribuyente."
      });
    });
};

// Obtener todos los Contribuyentes, con opción de búsqueda por nombre
exports.findAll = (req, res) => {
  const { nombre } = req.query;
  const condition = nombre ? { nombre: { [Op.like]: `${nombre}%` } } : null;

  Contribuyente.findAll({ where: condition, order: [['nombre', 'ASC']] })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al obtener los Contribuyentes."
      });
    });
};