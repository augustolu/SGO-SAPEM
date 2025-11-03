const db = require('../models');
const Contrato = db.contratos;
const Obra = db.obras;
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

exports.uploadContrato = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Error during file upload:", err);
      return res.status(500).send({ message: err.message || "No se pudo subir el contrato." });
    }

    if (!req.file) {
      return res.status(400).send({ message: "No se seleccionó ningún archivo." });
    }

    const obraId = req.body.obra_id;
    if (!obraId) {
      return res.status(400).send({ message: "ID de obra no proporcionado." });
    }

    try {
      const obra = await Obra.findByPk(obraId);
      if (!obra) {
        return res.status(404).send({ message: `Obra con ID ${obraId} no encontrada.` });
      }

      const existingContratosCount = await Contrato.count({
        where: { obra_id: obraId }
      });

      if (obra.cantidad_contratos && existingContratosCount >= obra.cantidad_contratos) {
        // Eliminar el archivo subido si excede el límite
        fs.unlinkSync(req.file.path);
        return res.status(400).send({ message: `Se ha alcanzado el número máximo de ${obra.cantidad_contratos} contratos para esta obra.` });
      }

      const contrato = await Contrato.create({
        nombre: req.file.originalname, // O puedes usar un nombre más descriptivo
        obra_id: obraId,
        nombre_archivo: req.file.filename,
        mime_type: req.file.mimetype,
        tamano_archivo: req.file.size,
        orden: existingContratosCount + 1, // Asignar un orden inicial
        estado: 'pendiente',
      });

      res.status(200).send({ message: "Contrato subido exitosamente!", contrato: contrato });
    } catch (error) {
      console.error("Error al guardar el contrato en la base de datos:", error);
      // Eliminar el archivo subido si falla la base de datos
      fs.unlinkSync(req.file.path);
      res.status(500).send({ message: "Error al guardar el contrato en la base de datos." });
    }
  });
};

exports.getContratosByObra = async (req, res) => {
  try {
    const obraId = req.params.obraId;
    const contratos = await Contrato.findAll({
      where: { obra_id: obraId },
      order: [['orden', 'ASC']],
    });
    res.status(200).send(contratos);
  } catch (error) {
    console.error("Error al obtener contratos:", error);
    res.status(500).send({ message: "Error al obtener los contratos." });
  }
};

exports.deleteContrato = async (req, res) => {
  try {
    const contratoId = req.params.id;
    const contrato = await Contrato.findByPk(contratoId);

    if (!contrato) {
      return res.status(404).send({ message: "Contrato no encontrado." });
    }

    // Eliminar el archivo físico
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'contratos', contrato.nombre_archivo);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await contrato.destroy();
    res.status(200).send({ message: "Contrato eliminado exitosamente!" });
  } catch (error) {
    console.error("Error al eliminar contrato:", error);
    res.status(500).send({ message: "Error al eliminar el contrato." });
  }
};
