
const db = require("../models");
const Actividad = db.Actividades;
const Op = db.Sequelize.Op;

// Create and Save a new Actividad
exports.create = (req, res) => {
  // Validate request
  if (!req.body.nombre) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Create a Actividad
  const actividad = {
    nombre: req.body.nombre,
    orden: req.body.orden,
    estado: req.body.estado,
    impacto: req.body.impacto,
    obra_id: req.body.obra_id
  };

  // Save Actividad in the database
  Actividad.create(actividad)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Actividad."
      });
    });
};

// Retrieve all Actividades from the database.
exports.findAll = (req, res) => {
  const nombre = req.query.nombre;
  var condition = nombre ? { nombre: { [Op.like]: `%${nombre}%` } } : null;

  Actividad.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving a ctividades."
      });
    });
};

// Find a single Actividad with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Actividad.findByPk(id)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Actividad with id=" + id
      });
    });
};

// Update a Actividad by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Actividad.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Actividad was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update Actividad with id=${id}. Maybe Actividad was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Actividad with id=" + id
      });
    });
};

// Delete a Actividad with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Actividad.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Actividad was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Actividad with id=${id}. Maybe Actividad was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Actividad with id=" + id
      });
    });
};

// Delete all Actividades from the database.
exports.deleteAll = (req, res) => {
  Actividad.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Actividades were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all actividades."
      });
    });
};
