const db = require("../models");
const Archivo = db.Archivos;
const path = require('path');
const fs = require('fs');

// Helper function to build the tree structure
const buildTree = (files) => {
  const fileMap = {};
  const tree = [];

  files.forEach(file => {
    fileMap[file.id] = { ...file.toJSON(), children: [] };
  });

  files.forEach(file => {
    if (file.parent_id) {
      if (fileMap[file.parent_id]) {
        fileMap[file.parent_id].children.push(fileMap[file.id]);
      }
    } else {
      tree.push(fileMap[file.id]);
    }
  });

  return tree;
};

exports.getArchivosPorObra = async (req, res) => {
  try {
    const obra_id = req.params.obra_id;
    const archivos = await Archivo.findAll({
      where: { obra_id: obra_id },
      order: [['tipo', 'DESC'], ['nombre_original', 'ASC']] // Folders first, then by name
    });

    const tree = buildTree(archivos);
    res.status(200).send(tree);
  } catch (error) {
    res.status(500).send({ message: `Error al obtener archivos: ${error.message}` });
  }
};

exports.createFolder = async (req, res) => {
  try {
    const { nombre, parent_id } = req.body;
    const obra_id = req.params.obra_id;

    if (!nombre) {
      return res.status(400).send({ message: "El nombre de la carpeta es requerido." });
    }

    const folder = await Archivo.create({
      nombre_original: nombre,
      obra_id: obra_id,
      parent_id: parent_id || null,
      tipo: 'folder'
    });

    res.status(201).send(folder);
  } catch (error) {
    res.status(500).send({ message: `Error al crear la carpeta: ${error.message}` });
  }
};

exports.uploadFiles = async (req, res) => {
  try {
    const { parent_id } = req.body;
    const obra_id = req.params.obra_id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).send({ message: "No se subieron archivos." });
    }

    const filePromises = req.files.map(file => {
      return Archivo.create({
        nombre_original: file.originalname,
        nombre_guardado: file.filename,
        ruta_archivo: `/uploads/documentos/${file.filename}`,
        mime_type: file.mimetype,
        tamano_archivo: file.size,
        obra_id: obra_id,
        parent_id: parent_id || null,
        tipo: 'file'
      });
    });

    const createdFiles = await Promise.all(filePromises);
    res.status(201).send(createdFiles);
  } catch (error) {
    // Cleanup uploaded files if there's a DB error
    req.files.forEach(file => {
      const filePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'documentos', file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    res.status(500).send({ message: `Error al guardar archivos: ${error.message}` });
  }
};

exports.deleteArchivo = async (req, res) => {
    try {
        const id = req.params.id;
        const archivo = await Archivo.findByPk(id, {
            include: [{
                model: Archivo,
                as: 'Children',
                include: { all: true, nested: true } // Recursive include
            }]
        });

        if (!archivo) {
            return res.status(404).send({ message: "Archivo o carpeta no encontrado." });
        }

        // Function to collect all file paths to be deleted
        const collectFilePaths = (node, paths = []) => {
            if (node.tipo === 'file' && node.nombre_guardado) {
                paths.push(path.join(__dirname, '..', '..', 'public', 'uploads', 'documentos', node.nombre_guardado));
            }
            if (node.Children) {
                node.Children.forEach(child => collectFilePaths(child, paths));
            }
            return paths;
        };

        const filePathsToDelete = collectFilePaths(archivo);

        // Delete from DB (ON DELETE CASCADE will handle children)
        await Archivo.destroy({ where: { id: id } });

        // Delete files from filesystem
        filePathsToDelete.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        res.status(200).send({ message: "Elemento eliminado correctamente." });
    } catch (error) {
        res.status(500).send({ message: `Error al eliminar el elemento: ${error.message}` });
    }
};

exports.renameArchivo = async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).send({ message: "El nuevo nombre es requerido." });
    }

    const archivo = await Archivo.findByPk(id);

    if (!archivo) {
      return res.status(404).send({ message: "Archivo o carpeta no encontrado." });
    }

    archivo.nombre_original = nombre;
    await archivo.save();

    res.status(200).send(archivo);
  } catch (error) {
    res.status(500).send({ message: `Error al renombrar el elemento: ${error.message}` });
  }
};
