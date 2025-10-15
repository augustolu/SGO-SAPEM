
const db = require("../models");
const Documento = db.Documentos;
const Op = db.Sequelize.Op;

// Create and Save a new Documento
exports.create = (req, res) => {
  // Validate request
  if (!req.body.nombre_archivo) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Create a Documento
  const documento = {
    nombre_archivo: req.body.nombre_archivo,
    ruta_archivo: req.body.ruta_archivo,
    obra_id: req.body.obra_id,
    actividad_id: req.body.actividad_id
  };

  // Save Documento in the database
  Documento.create(documento)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Documento."
      });
    });
};

// Retrieve all Documentos from the database.
exports.findAll = (req, res) => {
  const nombre_archivo = req.query.nombre_archivo;
  var condition = nombre_archivo ? { nombre_archivo: { [Op.like]: `%${nombre_archivo}%` } } : null;

  Documento.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving documentos."
      });
    });
};

// Find a single Documento with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Documento.findByPk(id)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Documento with id=" + id
      });
    });
};

// Update a Documento by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Documento.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Documento was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update Documento with id=${id}. Maybe Documento was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Documento with id=" + id
      });
    });
};

// Delete a Documento with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Documento.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Documento was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Documento with id=${id}. Maybe Documento was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Documento with id=" + id
      });
    });
};

// Delete all Documentos from the database.
exports.deleteAll = (req, res) => {
  Documento.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Documentos were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all documentos."
      });
    });
};
