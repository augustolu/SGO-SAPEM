
const db = require("../models");
const Obra = db.Obras;
const Op = db.Sequelize.Op;

// Create and Save a new Obra
exports.create = (req, res) => {
  // Validate request
  if (!req.body.titulo) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Create a Obra
  const obra = {
    titulo: req.body.titulo,
    descripcion: req.body.descripcion,
    ubicacion: req.body.ubicacion,
    numero_gestion: req.body.numero_gestion,
    categoria: req.body.categoria,
    estado: req.body.estado,
    fecha_inicio: req.body.fecha_inicio,
    fecha_finalizacion_estimada: req.body.fecha_finalizacion_estimada,
    plazo_dias: req.body.plazo_dias,
    monto_sapem: req.body.monto_sapem,
    monto_sub: req.body.monto_sub,
    af: req.body.af,
    rep_legal: req.body.rep_legal,
    can: req.body.can,
    contratista: req.body.contratista,
    progreso: req.body.progreso,
    motivo_anulacion: req.body.motivo_anulacion,
    inspector_id: req.body.inspector_id
  };

  // Save Obra in the database
  Obra.create(obra)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Obra."
      });
    });
};

// Retrieve all Obras from the database.
exports.findAll = (req, res) => {
  const titulo = req.query.titulo;
  var condition = titulo ? { titulo: { [Op.like]: `%${titulo}%` } } : null;

  Obra.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving obras."
      });
    });
};

// Find a single Obra with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Obra.findByPk(id)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Obra with id=" + id
      });
    });
};

// Update a Obra by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Obra.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Obra was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update Obra with id=${id}. Maybe Obra was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Obra with id=" + id
      });
    });
};

// Delete a Obra with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Obra.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Obra was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Obra with id=${id}. Maybe Obra was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Obra with id=" + id
      });
    });
};

// Delete all Obras from the database.
exports.deleteAll = (req, res) => {
  Obra.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Obras were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all obras."
      });
    });
};
