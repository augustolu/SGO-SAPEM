const db = require('../models');
const Contrato = db.contratos;
const Obra = db.Obras;
const Archivo = db.Archivos; // Importar el modelo Archivo
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Helper function to update obra progress
async function updateObraProgress(obraId) {
  try {
    const obra = await Obra.findByPk(obraId);
    if (!obra) {
      console.error(`Obra with ID ${obraId} not found for progress update.`);
      return;
    }

    const existingContratosCount = await Contrato.count({
      where: { obra_id: obraId }
    });

    let newProgress = 0;
    if (obra.cantidad_contratos && obra.cantidad_contratos > 0) {
      newProgress = (existingContratosCount / obra.cantidad_contratos) * 100;
    } else {
      newProgress = 0; // If cantidad_contratos is null or 0, progress is 0
    }

    // Ensure progress is between 0 and 100 and has at most 2 decimal places
    newProgress = Math.min(100, Math.max(0, parseFloat(newProgress.toFixed(2))));

    if (obra.progreso !== newProgress) {
      await obra.update({ progreso: newProgress });
      console.log(`Obra ID ${obraId} progress updated to ${newProgress}%`);
    }
  } catch (error) {
    console.error(`Error updating progress for Obra ID ${obraId}:`, error);
  }
}

exports.uploadContrato = async (req, res) => {
  console.log("--- Entering uploadContrato function ---");
  // Multer ya ha procesado el archivo y lo ha adjuntado a req.file
  if (!req.file) {
    console.log("No file selected for upload.");
    return res.status(400).send({ message: "No se seleccionó ningún archivo." });
  }

  console.log("File received:", req.file);

  const obraId = req.body.obra_id;
  console.log("Obra ID received:", obraId);

  if (!obraId) {
    // Si no hay obraId, eliminar el archivo subido ya que no se asociará a nada
    fs.unlinkSync(req.file.path);
    console.log("Obra ID not provided, file unlinked.");
    return res.status(400).send({ message: "ID de obra no proporcionado." });
  }

  try {
    const obra = await Obra.findByPk(obraId);
    if (!obra) {
      fs.unlinkSync(req.file.path);
      console.log(`Obra with ID ${obraId} not found, file unlinked.`);
      return res.status(404).send({ message: `Obra con ID ${obraId} no encontrada.` });
    }

    const existingContratosCount = await Contrato.count({
      where: { obra_id: obraId }
    });
    console.log("Existing contracts count:", existingContratosCount);

    if (obra.cantidad_contratos && existingContratosCount >= obra.cantidad_contratos) {
      fs.unlinkSync(req.file.path);
      console.log(`Max contracts reached for obra ID ${obraId}, file unlinked.`);
      return res.status(400).send({ message: `Se ha alcanzado el número máximo de ${obra.cantidad_contratos} contratos para esta obra.` });
    }

    const archivo = await Archivo.create({
      nombre_original: req.file.originalname,
      nombre_guardado: req.file.filename,
      ruta_archivo: `/uploads/contratos/${req.file.filename}`,
      mime_type: req.file.mimetype,
      tamano_archivo: req.file.size,
    });
    console.log("Archivo created:", archivo.toJSON());

    const contrato = await Contrato.create({
      nombre: req.file.originalname,
      obra_id: obraId,
      archivo_id: archivo.id,
      orden: existingContratosCount + 1,
      estado: 'pendiente',
    });
    console.log("Contrato created:", contrato.toJSON());

    // Update obra progress after successful upload
    await updateObraProgress(obraId);

    res.status(200).send({ message: "Contrato subido exitosamente!", contrato: contrato });
  } catch (error) {
    console.error("Detailed error al procesar el contrato o archivo:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log("File unlinked due to database error.");
    }
    res.status(500).send({ message: "Error al procesar el contrato o archivo." });
  }
};

exports.getContratosByObra = async (req, res) => {
  console.log("--- Entering getContratosByObra function ---");
  try {
    const obraId = req.params.obraId;
    console.log("Fetching contracts for Obra ID:", obraId);

    const contratos = await Contrato.findAll({
      where: { obra_id: obraId },
      include: [{
        model: Archivo,
        as: 'Archivo',
        attributes: ['nombre_original', 'ruta_archivo', 'mime_type']
      }],
      order: [['orden', 'ASC']],
    });

    const obra = await Obra.findByPk(obraId, { attributes: ['cantidad_contratos', 'progreso'] });

    console.log("Contracts fetched:", contratos.map(c => c.toJSON()));
    res.status(200).send({ contratos, cantidad_contratos: obra ? obra.cantidad_contratos : 0, progreso: obra ? obra.progreso : 0 });
  } catch (error) {
    console.error("Detailed error al obtener contratos:", error);
    res.status(500).send({ message: "Error al obtener los contratos." });
  }
};

exports.deleteContrato = async (req, res) => {
  try {
    const contratoId = req.params.id;
    console.log("Attempting to delete contract with ID:", contratoId);

    const contrato = await Contrato.findByPk(contratoId, {
      include: [{
        model: Archivo,
        as: 'Archivo'
      }]
    });

    if (!contrato) {
      console.log(`Contract with ID ${contratoId} not found.`);
      return res.status(404).send({ message: "Contrato no encontrado." });
    }
    console.log("Contrato found:", contrato.toJSON());

    if (contrato.Archivo && contrato.Archivo.ruta_archivo) {
      const filePath = path.join(__dirname, '..', 'public', contrato.Archivo.ruta_archivo);
      console.log("Attempting to delete physical file:", filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Physical file deleted.");
      } else {
        console.log("Physical file not found at path:", filePath);
      }
      await Archivo.destroy({ where: { id: contrato.archivo_id } });
      console.log("Archivo entry deleted from database.");
    }

    await contrato.destroy();
    console.log("Contrato entry deleted from database.");

    // Update obra progress after successful deletion
    await updateObraProgress(obra.id);

    res.status(200).send({ message: "Contrato y archivo asociado eliminados exitosamente!" });
  } catch (error) {
    console.error("Detailed error al eliminar contrato:", error);
    res.status(500).send({ message: "Error al eliminar el contrato." });
  }
};
