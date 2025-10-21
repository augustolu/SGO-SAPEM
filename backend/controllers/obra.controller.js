
const db = require("../models");
const Obra = db.Obras;
const RepresentanteLegal = db.RepresentantesLegales;
const Contribuyente = db.Contribuyentes;
const Op = db.Sequelize.Op;

// Create and Save a new Obra
exports.create = async (req, res) => {
  // Validate request
  if (!req.body.titulo) {
    return res.status(400).send({
      message: "Content can not be empty!"
    });
  }

  // LOG PARA VER QUÉ LLEGA AL BACKEND
  console.log('BACKEND: req.body recibido:', req.body);

  try {
    let representanteId = null;
    if (req.body.rep_legal) {
      const [representante] = await RepresentanteLegal.findOrCreate({
        where: { nombre: req.body.rep_legal },
        defaults: { nombre: req.body.rep_legal }
      });
      representanteId = representante.id;
    }

    let contribuyenteId = null;
    if (req.body.contratista) {
      const [contribuyente] = await Contribuyente.findOrCreate({
        where: { nombre: req.body.contratista },
        defaults: { nombre: req.body.contratista }
      });
      contribuyenteId = contribuyente.id;
    }

    // Mapeo final para la creación de la obra
    const obra = {
      establecimiento: req.body.titulo,
      numero_gestion: req.body.numero_gestion,
      categoria: req.body.categoria,
      detalle: req.body.descripcion,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      localidad: req.body.localidad,
      contribuyente_id: contribuyenteId,
      inspector_id: req.body.inspector_id || null,
      representante_legal_id: representanteId,
      monto_sapem: req.body.monto_sapem || null,
      monto_sub: req.body.monto_sub || null,
      af: req.body.af || null,
      plazo: req.body.plazo_dias || null,
      fecha_inicio: req.body.fecha_inicio || null,
      fecha_finalizacion_estimada: req.body.fecha_finalizacion_estimada || null,
      estado: req.body.estado,
      progreso: req.body.progreso || 0,
      // El campo 'nro' se omite intencionadamente porque no existe en el modelo de la BD.
    };

    // LOG PARA VER QUÉ SE INTENTA GUARDAR EN LA BASE DE DATOS
    console.log('BACKEND: Objeto a crear en la BD:', obra);

    const createdObra = await Obra.create(obra);
    res.status(201).send(createdObra);

  } catch (err) {
    console.error("Error al crear la Obra:", err);
    res.status(500).send({
      message: err.message || "Ocurrió un error al crear la Obra."
    });
  }
};

/*
  // Create a Obra
  const obra = {
    establecimiento: req.body.titulo, // from Step 1
    numero_gestion: req.body.numero_gestion, // from Step 1
    categoria: req.body.categoria, // from Step 1
    detalle: req.body.descripcion, // from Step 1
    // nro: req.body.nro, // ERROR: Este campo no existe en el modelo 'obra.model.js'
    latitude: req.body.latitude, // from Step 2
    longitude: req.body.longitude, // from Step 2
    localidad: req.body.localidad, // from Step 2
    // 'ubicacion' del form se usa para geocodificación, pero no se guarda directamente. 'localidad' sí.
    contratista: req.body.contratista, // from Step 2
    inspector_id: req.body.inspector_id || null, // from Step 2
    representante_legal_id: req.body.rep_legal || null, // El frontend ahora envía el ID correcto
    monto_sapem: req.body.monto_sapem || null, // from Step 3
    monto_sub: req.body.monto_sub || null, // from Step 3
    af: req.body.af || null, // from Step 3
    plazo: req.body.plazo_dias || null, // from Step 3
    fecha_inicio: req.body.fecha_inicio || null, // from Step 3
    fecha_finalizacion_estimada: req.body.fecha_finalizacion_estimada || null, // from Step 3
    estado: req.body.estado, // from Step 3
    progreso: req.body.progreso || 0, // Default to 0
    // 'can' y 'motivo_anulacion' no están en el formulario de creación, se manejarán en la actualización
  };

  // LOG PARA VER QUÉ SE INTENTA GUARDAR EN LA BASE DE DATOS
  console.log('BACKEND: Objeto a crear en la BD:', obra);

  // Save Obra in the database
  Obra.create(obra)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      // MEJORA: Loguear el error completo en el servidor para mejor depuración
      console.error("Error al crear la Obra:", err); 
      res.status(500).send({
        message:
          err.message || "Ocurrió un error al crear la Obra."
      });
    });*/

// Retrieve all Obras from the database.
exports.findAll = (req, res) => {
  const titulo = req.query.titulo;
  // CORRECCIÓN: Cambiar 'titulo' por 'establecimiento' para que coincida con el modelo
  var condition = titulo ? { establecimiento: { [Op.like]: `%${titulo}%` } } : null;
  
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
  
  // MEJORA: Incluir modelos relacionados para la página de detalles
  Obra.findByPk(id, {
    include: [
      { model: db.Actividades, as: 'Actividades' }, // Asegúrate que el 'as' coincida si lo tienes definido
      { model: db.Documentos, as: 'Documentos' },
      { model: db.Usuarios, as: 'Usuario' }, // Para obtener el nombre del inspector
      { model: db.RepresentantesLegales, as: 'RepresentanteLegal' },
      { model: db.Contribuyentes, as: 'Contribuyente' }
    ]
  })
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
