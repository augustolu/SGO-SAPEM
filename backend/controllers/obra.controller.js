const db = require("../models");
const Contrato = db.Contratos;
const xlsx = require('xlsx');
const fs = require('fs');
const Archivo = db.Archivos;
const bcrypt = require("bcryptjs");

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

    const plazoDias = req.body.plazo_dias ? Number(req.body.plazo_dias) : null;
    let cantidadContratos = req.body.cantidad_contratos ? Number(req.body.cantidad_contratos) : null;

    if (plazoDias && plazoDias > 0) {
      cantidadContratos = Math.ceil(plazoDias / 30);
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
      af: req.body.af ? Number(req.body.af) : 0,
      plazo: plazoDias,
      cantidad_contratos: cantidadContratos, // Añadir cantidad_contratos
      fecha_inicio: req.body.fecha_inicio || null,
      fecha_finalizacion_estimada: req.body.fecha_finalizacion_estimada || null,
      estado: req.body.estado,
      progreso: req.body.progreso || 0,
      nro: req.body.nro ? Number(req.body.nro) : null,
      imagen_url: req.body.imagen_url, // ¡AÑADIDO!
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



// --- AÑADE ESTA FUNCIÓN COMPLETA AL FINAL DEL ARCHIVO ---

exports.uploadObras = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo.' });
  }

  const mapa = JSON.parse(req.body.mapa_json || '{}');
  const colorToStatusMap = JSON.parse(req.body.color_mapa_json || '{}');
  const categoria = req.body.categoria || 'varios';
  const filePath = req.file.path;
  const transaction = await db.sequelize.transaction();
  const newlyCreatedUsers = [];

  const getMappedValue = (row, dbFieldName, mapa) => {
    const excelHeader = mapa[dbFieldName];
    return excelHeader && row[excelHeader] !== undefined ? row[excelHeader] : null;
  };

  try {
    const inspectorRole = await db.Roles.findOne({ where: { nombre: 'Inspector' } });
    if (!inspectorRole) {
      await transaction.rollback();
      return res.status(500).json({ message: "El rol 'Inspector' no fue encontrado." });
    }

    const workbook = xlsx.readFile(filePath, { cellStyles: true });
    const sheetName = req.body.sheetName || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

    if (data.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'El archivo Excel está vacío.' });
    }

    let importedCount = 0;
    const errors = [];

    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2;
      let estado = 'En ejecución';
      const headerRow = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0];

      for (let c = 0; c < headerRow.length; c++) {
        const cellAddress = xlsx.utils.encode_cell({ r: index + 1, c: c });
        if (sheet[cellAddress]) {
          const cell = sheet[cellAddress];
          const cellColor = cell?.s?.bgColor?.rgb || cell?.s?.fgColor?.rgb;
          if (cellColor) {
            const cleanColor = `#${String(cellColor).slice(-6).toUpperCase()}`;
            if (colorToStatusMap[cleanColor] && colorToStatusMap[cleanColor] !== '') {
              estado = colorToStatusMap[cleanColor];
              break;
            }
          }
        }
      }

      try {
        let localidadId = null;
        const localidadNombre = getMappedValue(row, 'localidad', mapa);
        if (localidadNombre && String(localidadNombre).trim() !== '') {
          const [localidad] = await db.Localidades.findOrCreate({
            where: { nombre: String(localidadNombre).trim() },
            defaults: { nombre: String(localidadNombre).trim() },
            transaction
          });
          localidadId = localidad.id;
        }

        let contribuyenteId = null;
        const contratistaNombre = getMappedValue(row, 'contratista', mapa);
        if (contratistaNombre && String(contratistaNombre).trim() !== '') {
          const [contribuyente] = await db.Contribuyentes.findOrCreate({
            where: { nombre: String(contratistaNombre).trim() },
            defaults: { nombre: String(contratistaNombre).trim() },
            transaction
          });
          contribuyenteId = contribuyente.id;
        }

        let representanteId = null;
        const repLegalNombre = getMappedValue(row, 'rep_legal', mapa);
        if (repLegalNombre && String(repLegalNombre).trim() !== '') {
          const [representante] = await db.RepresentantesLegales.findOrCreate({
            where: { nombre: String(repLegalNombre).trim() },
            defaults: { nombre: String(repLegalNombre).trim() },
            transaction
          });
          representanteId = representante.id;
        }

        let inspectorId = null;
        const inspectorNombre = getMappedValue(row, 'inspector_id', mapa);
        if (inspectorNombre && String(inspectorNombre).trim() !== '') {
          const nombreCompleto = String(inspectorNombre).trim();
          let inspector = await db.Usuarios.findOne({ where: { nombre: nombreCompleto }, transaction });

          if (!inspector) {
            const newPassword = Math.random().toString(36).slice(-8);
            const username = nombreCompleto.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + Math.floor(1000 + Math.random() * 9000);

            try {
              inspector = await db.Usuarios.create({
                nombre: nombreCompleto,
                username: username,
                email: `${username}@sapem-placeholder.com`,
                password: bcrypt.hashSync(newPassword, 8),
                rol_id: inspectorRole.id
              }, { transaction });

              newlyCreatedUsers.push({
                'Nombre Completo': nombreCompleto,
                'Usuario': username,
                'Contraseña': newPassword
              });
            } catch (error) {
              if (error.name === 'SequelizeUniqueConstraintError') {
                throw new Error(`No se pudo crear un nombre de usuario único para el inspector '${nombreCompleto}'. Por favor, intente de nuevo.`);
              }
              throw error;
            }
          }
          inspectorId = inspector.id;
        }

        const plazoDias = getMappedValue(row, 'plazo', mapa);
        const cantidadContratos = plazoDias && Number(plazoDias) > 0 ? Math.ceil(Number(plazoDias) / 30) : 1;

        let fechaInicio = getMappedValue(row, 'fecha_inicio', mapa);
        if (!fechaInicio) {
          fechaInicio = new Date();
        } else {
          // Convertir la fecha de Excel (número de serie) a una fecha de JavaScript
          if (typeof fechaInicio === 'number') {
            fechaInicio = new Date(Math.round((fechaInicio - 25569) * 86400 * 1000));
          } else {
            fechaInicio = new Date(fechaInicio);
          }
        }
        
        let fechaFinalizacionEstimada = getMappedValue(row, 'fecha_finalizacion_estimada', mapa);
        if (fechaFinalizacionEstimada) {
          if (typeof fechaFinalizacionEstimada === 'number') {
            fechaFinalizacionEstimada = new Date(Math.round((fechaFinalizacionEstimada - 25569) * 86400 * 1000));
          } else {
            fechaFinalizacionEstimada = new Date(fechaFinalizacionEstimada);
          }
        }
        
        if (plazoDias && fechaInicio && !isNaN(new Date(fechaInicio).getTime())) {
          const fechaInicioDate = new Date(fechaInicio);
          fechaFinalizacionEstimada = new Date(fechaInicioDate.setDate(fechaInicioDate.getDate() + parseInt(plazoDias, 10)));
        }

        const obraData = {
          nro: getMappedValue(row, 'nro', mapa) || null,
          establecimiento: getMappedValue(row, 'establecimiento', mapa) || 'Sin especificar',
          numero_gestion: getMappedValue(row, 'numero_gestion', mapa),
          detalle: getMappedValue(row, 'detalle', mapa) || null,
          localidad_id: localidadId,
          contribuyente_id: contribuyenteId,
          categoria: categoria,
          estado: estado,
          plazo: plazoDias || null,
          cantidad_contratos: cantidadContratos,
          fecha_inicio: fechaInicio,
          fecha_finalizacion_estimada: fechaFinalizacionEstimada,
          monto_sapem: getMappedValue(row, 'monto_sapem', mapa) || 0,
          monto_sub: getMappedValue(row, 'monto_sub', mapa) || 0,
          af: getMappedValue(row, 'af', mapa) || 0,
          representante_legal_id: representanteId,
          inspector_id: inspectorId,
          progreso: getMappedValue(row, 'progreso', mapa) || 0,
        };

        await Obra.create(obraData, { transaction });
        importedCount++;
      } catch (rowError) {
        errors.push(`Error en fila ${rowNumber}: ${rowError.message}`);
      }
    }

    if (errors.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Ocurrieron errores al procesar las filas. No se importó ninguna obra.',
        errors,
        importedCount: 0
      });
    }

    await transaction.commit();

    if (newlyCreatedUsers.length > 0) {
      const worksheet = xlsx.utils.json_to_sheet(newlyCreatedUsers);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Nuevas Cuentas');
      const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      res.setHeader('Content-Disposition', 'attachment; filename="Cuentas de inspectores.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } else {
      res.status(200).json({
        message: `¡Éxito! Se importaron ${importedCount} obras. No se crearon nuevos usuarios.`,
        importedCount,
        newlyCreatedUsers: []
      });
    }

  } catch (error) {
    await transaction.rollback();
    console.error('Error en la importación de Excel:', error);
    res.status(500).json({ message: 'Error en el servidor al procesar el archivo.', errors: [error.message] });
  } finally {
    fs.unlinkSync(filePath);
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
    let condition = {
      motivo_anulacion: { [Op.is]: null }, // No mostrar obras con motivo de anulación
      ...(titulo ? { establecimiento: { [Op.like]: `%${titulo}%` } } : {})
    };

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

    const obras = await Obra.findAll({
      where: condition,
      include: [
        { model: db.Contribuyentes, as: 'Contribuyente', attributes: ['nombre'], required: false },
        { model: db.Localidades, as: 'Localidad', attributes: ['nombre'], required: false },
        { model: db.RepresentantesLegales, as: 'RepresentanteLegal', attributes: ['nombre'], required: false },
        { model: db.Usuarios, as: 'Usuario', attributes: ['nombre'], required: false }
      ]
    });

    const obrasConProgreso = await Promise.all(obras.map(async (obra) => {
      const uploadedContractsCount = await Contrato.count({ where: { obra_id: obra.id } });
      const totalContracts = obra.cantidad_contratos > 0 ? obra.cantidad_contratos : 1;
      const newProgreso = Math.min(100, Math.round((uploadedContractsCount / totalContracts) * 100));
      
      // Actualizamos la instancia de la obra en la base de datos
      if (obra.progreso !== newProgreso) {
        await obra.update({ progreso: newProgreso });
      }

      const obraJSON = obra.toJSON();

      return {
        ...obraJSON,
        progreso: newProgreso,
        contratista_nombre: obraJSON.Contribuyente?.nombre,
        localidad_nombre: obraJSON.Localidad?.nombre,
        rep_legal_nombre: obraJSON.RepresentanteLegal?.nombre,
        inspector_nombre: obraJSON.Usuario?.nombre,
      };
    }));

    res.send(obrasConProgreso);
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

      { model: db.Contratos, as: 'Contratos', required: false, include: [{
        model: db.Archivos,
        as: 'Archivo',
        attributes: ['ruta_archivo', 'nombre_original']
      }]} // Include Contratos with explicit attributes and Archivo
    ]
  })
    .then(data => {
      if (data) {
        // Aplanamos los datos para que sean consistentes con findAll
        const obraData = data.toJSON(); // Convertimos la instancia de Sequelize a un objeto plano
        const obraMapeada = {
          ...obraData,
          progreso: obraData.progreso, // Asegurarse de que el progreso se incluya
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
      console.error("--- ERROR DETALLADO AL OBTENER LA OBRA (findOne) ---");
      console.error("Mensaje:", err.message);
      console.error("Stack Trace:", err);
      console.error("--- FIN DEL ERROR DETALLADO ---");
      res.status(500).send({
        message: "Error retrieving Obra with id=" + id + ": " + err.message
      });
    });
};

// Update a Obra by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;
  // console.log('UPDATE /obras/:id req.body:', req.body);

  try {
    // Resolver IDs de campos de autocompletado
    let localidadId = req.body.localidad_id;
    if (req.body.localidad_nombre && isNaN(req.body.localidad_nombre)) {
        const [localidad] = await Localidad.findOrCreate({
            where: { nombre: req.body.localidad_nombre },
            defaults: { nombre: req.body.localidad_nombre }
        });
        localidadId = localidad.id;
    }

    let contribuyenteId = req.body.contribuyente_id;
    if (req.body.contratista_nombre && isNaN(req.body.contratista_nombre)) {
        const [contribuyente] = await Contribuyente.findOrCreate({
            where: { nombre: req.body.contratista_nombre },
            defaults: { nombre: req.body.contratista_nombre }
        });
        contribuyenteId = contribuyente.id;
    }

    let representanteId = req.body.representante_legal_id;
    if (req.body.rep_legal_nombre && isNaN(req.body.rep_legal_nombre)) {
        const [representante] = await RepresentanteLegal.findOrCreate({
            where: { nombre: req.body.rep_legal_nombre },
            defaults: { nombre: req.body.rep_legal_nombre }
        });
        representanteId = representante.id;
    }

    const {
      establecimiento,
      numero_gestion,
      categoria,
      descripcion,
      latitude,
      longitude,
      inspector_id,
      monto_sapem,
      monto_sub,
      af,
      plazo_dias,
      fecha_inicio,
      fecha_finalizacion_estimada,
      estado,
      progreso,
      motivo_anulacion,
      nro
    } = req.body;

    let { cantidad_contratos } = req.body;

    if (req.body.hasOwnProperty('plazo_dias')) {
        const plazoNum = Number(plazo_dias);
        if (plazoNum > 0) {
            cantidad_contratos = Math.ceil(plazoNum / 30);
        } else {
            cantidad_contratos = null;
        }
    }

    const updateData = {
      establecimiento,
      numero_gestion,
      categoria,
      detalle: descripcion,
      latitude,
      longitude,
      localidad_id: localidadId,
      contribuyente_id: contribuyenteId,
      inspector_id,
      representante_legal_id: representanteId,
      monto_sapem: monto_sapem ? Number(String(monto_sapem).replace(/[^0-9.-]+/g,"")) : null,
      monto_sub: monto_sub ? Number(String(monto_sub).replace(/[^0-9.-]+/g,"")) : null,
      af: af ? Number(String(af).replace(/[^0-9.-]+/g,"")) : null,
      plazo: plazo_dias ? Number(plazo_dias) : null,
      cantidad_contratos: cantidad_contratos ? Number(cantidad_contratos) : null,
      fecha_inicio,
      fecha_finalizacion_estimada,
      estado,
      progreso,
      motivo_anulacion,
      nro
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

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

      // Solo aplicar la restricción de tiempo si la fecha de inicio existe
      if (obra.fecha_inicio) {
        const now = new Date();
        const parts = obra.fecha_inicio.split('T')[0].split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const fechaInicio = new Date(year, month, day);
        const oneWeekAfterStartDate = new Date(fechaInicio.getTime() + (7 * 24 * 60 * 60 * 1000));

        if (now > oneWeekAfterStartDate) {
          return res.status(403).send({
            message: "No tiene permiso para editar esta obra. Han transcurrido más de una semana desde la fecha de inicio."
          });
        }
      }
      // Si no hay fecha de inicio, el inspector puede editar libremente.
    }

    const [num] = await Obra.update(updateData, {
      where: { id: id }
    });

    if (num == 1) {
      const updatedObra = await Obra.findByPk(id, {
        include: [
          { model: db.Contribuyentes, as: 'Contribuyente', attributes: ['nombre'], required: false },
          { model: db.Localidades, as: 'Localidad', attributes: ['nombre'], required: false },
          { model: db.RepresentantesLegales, as: 'RepresentanteLegal', attributes: ['nombre'], required: false },
          { model: db.Usuarios, as: 'Usuario', attributes: ['nombre'], required: false }
        ]
      });

      if (updatedObra) {
        const obraData = updatedObra.toJSON();
        const obraMapeada = {
          ...obraData,
          progreso: obraData.progreso, // Asegurarse de que el progreso se incluya
          contratista_nombre: obraData.Contribuyente?.nombre,
          localidad_nombre: obraData.Localidad?.nombre,
          descripcion: obraData.detalle,
          plazo_dias: obraData.plazo,
          rep_legal_nombre: obraData.RepresentanteLegal?.nombre,
          inspector_nombre: obraData.Usuario?.nombre,
        };
        res.send(obraMapeada);
      } else {
        res.status(404).send({ message: `Obra with id=${id} not found after update.` });
      }
    } else {
      res.status(400).send({
        message: `Cannot update Obra with id=${id}. Maybe Obra was not found or req.body is empty!`
      });
    }
  } catch (err) {
    console.error("Error updating Obra:", err);
    res.status(500).send({
      message: err.message || "Error updating Obra with id=" + id
    });
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

// Upload a contract for an Obra
exports.uploadContrato = async (req, res) => {
  try {
    const id = req.params.id;

    if (!req.file) {
      return res.status(400).send({ message: "No se adjuntó ningún archivo de contrato." });
    }

    const obra = await Obra.findByPk(id);

    if (!obra) {
      return res.status(404).send({ message: `No se encontró la Obra con id=${id}.` });
    }

    // Assuming you want to store the path relative to the public folder
    const relativePath = req.file.path.split('public')[1].replace(/\\/g, '/');

    // Create Archivo entry
    const archivo = await Archivo.create({
      nombre_original: req.file.originalname,
      nombre_guardado: req.file.filename,
      ruta_archivo: relativePath,
      mime_type: req.file.mimetype,
      tamano_archivo: req.file.size,
      obra_id: id,
      tipo: 'file'
    });

    // Create Contrato entry, linking to Archivo and Obra
    // Assuming 'nombre' and 'orden' are sent in req.body for the contract
    const { nombre, orden } = req.body;
    await Contrato.create({
      nombre: nombre || req.file.originalname, // Use original filename as default name
      orden: orden || 0, // Default order to 0
      obra_id: id,
      archivo_id: archivo.id
    });

    // Recalculate progress based on uploaded contracts
    const newProgreso = await updateObraProgress(id);

    res.status(200).send({ message: "Contrato subido exitosamente.", newProgreso: newProgreso });
  } catch (err) {
    console.error("Error al subir el contrato:", err);
    res.status(500).send({
      message: err.message || "Ocurrió un error al subir el contrato."
    });
  }
};

// Get all contracts for an Obra
exports.getContratos = async (req, res) => {
  try {
    const obraId = req.params.id;
    const contratos = await db.Contratos.findAll({
      where: { obra_id: obraId },
      include: [{
        model: db.Archivos,
        as: 'Archivo',
        attributes: ['ruta_archivo', 'nombre_original']
      }]
    });
    res.status(200).send(contratos);
  } catch (err) {
    console.error("Error al obtener contratos:", err);
    res.status(500).send({
      message: err.message || "Ocurrió un error al obtener los contratos."
    });
  }
};

// Helper function to calculate and update obra progress
const updateObraProgress = async (obraId) => {
  const obra = await Obra.findByPk(obraId);
  if (!obra) {
    throw new Error(`Obra con id=${obraId} no encontrada.`);
  }

  const uploadedContractsCount = await Contrato.count({ where: { obra_id: obraId } });
  const totalContracts = obra.cantidad_contratos || 1; // Default to 1 to avoid division by zero
  const newProgreso = Math.min(100, Math.round((uploadedContractsCount / totalContracts) * 100));

  obra.progreso = newProgreso;
  try {
    await obra.save();
  } catch (saveErr) {
    console.error(`Error saving obra progress for obraId=${obraId}:`, saveErr);
    // Re-throw the error so it's caught by the main uploadContrato catch block
    throw saveErr;
  }
  return newProgreso;
};

// Delete a contract from an Obra
exports.deleteContrato = async (req, res) => {
  try {
    const { obraId, contratoId } = req.params;

    const contrato = await Contrato.findOne({
      where: { id: contratoId, obra_id: obraId }
    });

    if (!contrato) {
      return res.status(404).send({ message: `No se encontró el contrato con id=${contratoId} para la obra con id=${obraId}.` });
    }

    const archivoId = contrato.archivo_id;

    // Delete the Contrato
    await Contrato.destroy({ where: { id: contratoId } });

    // Delete the associated Archivo
    if (archivoId) {
      await Archivo.destroy({ where: { id: archivoId } });
    }

    const newProgreso = await updateObraProgress(obraId);
    res.status(200).send({ message: "Contrato eliminado exitosamente.", newProgreso: newProgreso });
  } catch (err) {
    console.error("Error al eliminar el contrato:", err);
    res.status(500).send({
      message: err.message || "Ocurrió un error al eliminar el contrato."
    });
  }
};