const db = require("../models");

// DEBUG: Imprime todos los modelos disponibles en el objeto db. Revisa la consola de tu servidor.
console.log("Modelos disponibles en DB:", Object.keys(db));

const Obra = db.Obras;
const RepresentanteLegal = db.RepresentantesLegales;
const Contribuyente = db.Contribuyentes;
const Localidad = db.Localidades; // Añadir Localidad
const Usuario = db.Usuarios;
const Role = db.Roles;
const Op = db.Sequelize.Op;

// Create and Save a new Obra
exports.create = async (req, res) => {
  // Validate request
  if (!req.body.establecimiento) {
    return res.status(400).send({
      message: "El campo 'establecimiento' (título) no puede estar vacío."
    });
  }

  // LOG PARA VER QUÉ LLEGA AL BACKEND
  console.log('BACKEND: req.body recibido:', req.body);

  try {
    let representanteId = null;
    if (req.body.rep_legal) {
      // Si el valor no es un número, es un nombre nuevo y se crea.
      if (isNaN(req.body.rep_legal)) {
        const [representante] = await RepresentanteLegal.findOrCreate({
          where: { nombre: req.body.rep_legal },
          defaults: { nombre: req.body.rep_legal }
        });
        representanteId = representante.id;
      } else {
        // Si es un número, se usa directamente como ID.
        representanteId = req.body.rep_legal;
      }
    }

    let contribuyenteId = null;
    if (req.body.contratista) {
      // Si el valor no es un número, es un nombre nuevo y se crea.
      if (isNaN(req.body.contratista)) {
        const [contribuyente] = await Contribuyente.findOrCreate({
          where: { nombre: req.body.contratista },
          defaults: { nombre: req.body.contratista }
        });
        contribuyenteId = contribuyente.id;
      } else {
        // Si es un número, se usa directamente como ID.
        contribuyenteId = req.body.contratista;
      }
    }

    let localidadId = null;
    if (req.body.localidad_id) {
      if (isNaN(req.body.localidad_id)) {
        const [localidad, created] = await Localidad.findOrCreate({
          where: { nombre: req.body.localidad_id },
          defaults: { nombre: req.body.localidad_id }
        });
        localidadId = localidad.id;
      } else {
        localidadId = req.body.localidad_id;
      }
    }

    // Mapeo final para la creación de la obra
    const obra = {
      establecimiento: req.body.establecimiento,
      numero_gestion: req.body.numero_gestion,
      categoria: req.body.categoria,
      detalle: req.body.descripcion,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      localidad_id: localidadId, // Usar el ID de la localidad
      contribuyente_id: contribuyenteId,
      inspector_id: req.body.inspector_id || null,
      representante_legal_id: representanteId,
      monto_sapem: req.body.monto_sapem ? Number(req.body.monto_sapem) : null,
      monto_sub: req.body.monto_sub ? Number(req.body.monto_sub) : null,
      af: req.body.af ? Number(req.body.af) : null,
      plazo: req.body.plazo_dias ? Number(req.body.plazo_dias) : null,
      cantidad_contratos: req.body.cantidad_contratos ? Number(req.body.cantidad_contratos) : null, // Añadir cantidad_contratos
      fecha_inicio: req.body.fecha_inicio || null,
      fecha_finalizacion_estimada: req.body.fecha_finalizacion_estimada || null,
      estado: req.body.estado,
      progreso: req.body.progreso || 0,
      nro: req.body.nro ? Number(req.body.nro) : null,
      imagen_url: req.body.imagen_url || null // Añadir imagen_url
    };

    // LOG PARA VER QUÉ SE INTENTA GUARDAR EN LA BASE DE DATOS
    console.log('BACKEND: Objeto a crear en la BD:', obra);

    const createdObra = await Obra.create(obra);
    res.status(201).send(createdObra);

  } catch (err) {
    // --- MEJORA DE LOGGING ---
    console.error("--- ERROR DETALLADO AL CREAR LA OBRA ---");
    console.error("Mensaje:", err.message);
    
    // Si es un error de validación de Sequelize, tendrá un array 'errors'
    if (err.name === 'SequelizeValidationError') {
      console.error("Errores de validación:");
      err.errors.forEach(e => {
        console.error(`- Campo: ${e.path}, Valor: '${e.value}', Error: ${e.message}`);
      });
    } else {
      // Para otros tipos de errores, loguear el stack trace completo
      console.error("Stack Trace:", err);
    }
    console.error("--- FIN DEL ERROR DETALLADO ---");
    // -------------------------

    // --- MEJORA DE RESPUESTA AL CLIENTE ---
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors[0].path;
      const value = err.errors[0].value;
      return res.status(409).send({ // 409 Conflict
        message: `El valor '${value}' para el campo '${field}' ya existe. Por favor, utilice uno diferente.`
      });
    }
    // ------------------------------------

    res.status(500).send({
      message: err.message || "Ocurrió un error al crear la Obra."
    });
  }
};

// Check if a numero_gestion already exists
exports.checkNumeroGestion = async (req, res) => {
  try {
    const obra = await Obra.findOne({
      where: { numero_gestion: req.params.numero_gestion }
    });

    if (obra) {
      return res.status(200).send({ exists: true });
    } else {
      return res.status(200).send({ exists: false });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al verificar el número de gestión."
    });
  }
};


// Retrieve all Obras from the database.
exports.findAll = async (req, res) => {
  try {
    const titulo = req.query.titulo;
    let condition = titulo ? { establecimiento: { [Op.like]: `%${titulo}%` } } : {};

    const user = await db.Usuarios.findByPk(req.userId, {
      include: { model: db.Roles, as: 'role' }
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const userRole = user.role.nombre;

    if (userRole === 'Inspector') {
      condition.inspector_id = req.userId;
    }

    const data = await Obra.findAll({ 
      where: condition,
      include: [
        {
          model: db.Contribuyentes,
          as: 'Contribuyente',
          attributes: ['nombre'],
          required: false
        },
        {
          model: db.Localidades,
          as: 'Localidad',
          attributes: ['nombre'],
          required: false
        },
        {
          model: db.RepresentantesLegales,
          as: 'RepresentanteLegal',
          attributes: ['nombre'],
          required: false
        },
        {
          model: db.Usuarios,
          as: 'Usuario',
          attributes: ['nombre'],
          required: false
        }
      ],
      raw: true,
      nest: true
    });

    const obrasMapeadas = data.map(obra => ({
      ...obra,
      contratista_nombre: obra.Contribuyente?.nombre,
      localidad_nombre: obra.Localidad?.nombre,
      rep_legal_nombre: obra.RepresentanteLegal?.nombre,
      inspector_nombre: obra.Usuario?.nombre,
      Contribuyente: undefined, Localidad: undefined, RepresentanteLegal: undefined, Usuario: undefined
    }));

    res.send(obrasMapeadas);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving obras."
    });
  }
};

// Find a single Obra with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  
  // MEJORA: Incluir modelos relacionados para la página de detalles
  Obra.findByPk(id, {
    include: [ // Incluimos los mismos modelos que en findAll para consistencia
      { model: db.Contribuyentes, as: 'Contribuyente', attributes: ['nombre'], required: false },
      { model: db.Localidades, as: 'Localidad', attributes: ['nombre'], required: false },
      { model: db.RepresentantesLegales, as: 'RepresentanteLegal', attributes: ['nombre'], required: false },
      { model: db.Usuarios, as: 'Usuario', attributes: ['nombre'], required: false },
      { model: db.Actividades, as: 'Actividades', required: false },
      { model: db.Documentos, as: 'Documentos', required: false }
    ]
  })
    .then(data => {
      if (data) {
        // Aplanamos los datos para que sean consistentes con findAll
        const obraData = data.toJSON(); // Convertimos la instancia de Sequelize a un objeto plano
        const obraMapeada = {
          ...obraData,
          contratista_nombre: obraData.Contribuyente?.nombre,
          localidad_nombre: obraData.Localidad?.nombre,
          descripcion: obraData.detalle, // Mapeo para el frontend
          plazo_dias: obraData.plazo, // Mapeo para el frontend
          rep_legal_nombre: obraData.RepresentanteLegal?.nombre,
          inspector_nombre: obraData.Usuario?.nombre,
        };
        res.send(obraMapeada);
      } else {
        res.status(404).send({
          message: `No se encontró la Obra con id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Obra with id=" + id
      });
    });
};

// Update a Obra by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const user = await Usuario.findByPk(req.userId, {
      include: { model: Role, as: 'role' }
    });

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const userRole = user.role.nombre;

    if (userRole === 'Inspector') {
      const obra = await Obra.findByPk(id);
      if (!obra) {
        return res.status(404).send({ message: "Obra not found." });
      }

      const now = new Date();
      const fechaInicio = new Date(obra.fecha_inicio);
      const createdAt = new Date(obra.createdAt);
      const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));

      if (fechaInicio <= now || createdAt <= twoDaysAgo) {
        return res.status(403).send({
          message: "No tiene permiso para editar esta obra. La fecha de inicio ya ha pasado o han transcurrido más de 2 días desde su creación."
        });
      }
    }

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
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
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

// Asignar un inspector a una obra
exports.asignarInspector = async (req, res) => {
  try {
    const { obraId, inspectorId } = req.body;

    if (!obraId || !inspectorId) {
      return res.status(400).send({
        message: "Los campos 'obraId' y 'inspectorId' son obligatorios."
      });
    }

    const obra = await Obra.findByPk(obraId);

    if (!obra) {
      return res.status(404).send({
        message: `No se encontró la Obra con id=${obraId}.`
      });
    }

    obra.inspector_id = inspectorId;
    await obra.save();

    res.status(200).send({
      message: `Inspector con id=${inspectorId} asignado correctamente a la Obra con id=${obraId}.`
    });

  } catch (err) {
    res.status(500).send({
      message: err.message || "Ocurrió un error al asignar el inspector."
    });
  }
};