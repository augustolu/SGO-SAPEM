const db = require("../models");
const RepresentanteLegal = db.RepresentantesLegales;
const { Op } = db.Sequelize;

// Crear y guardar un nuevo Representante Legal
exports.create = (req, res) => {
  if (!req.body.nombre) {
    return res.status(400).send({ message: "El nombre no puede estar vacío." });
  }

  RepresentanteLegal.create({ nombre: req.body.nombre })
    .then(data => {
      // Devolvemos el representante creado, incluyendo su nuevo ID
      res.status(201).send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al crear el Representante Legal."
      });
    });
};

// Obtener todos los Representantes Legales, con opción de búsqueda por nombre
exports.findAll = (req, res) => {
  const { nombre } = req.query;
  const condition = nombre ? { nombre: { [Op.like]: `${nombre}%` } } : null;

  RepresentanteLegal.findAll({ where: condition, order: [['nombre', 'ASC']] })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al obtener los Representantes Legales."
      });
    });
};